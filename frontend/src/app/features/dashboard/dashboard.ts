import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Observable } from 'rxjs';

import { ApiService } from '../../core/api/api.service';
import { Card, UpcomingItem } from '../../core/api/models';
import { AppState } from '../../core/state/app-state.service';
import { EmptyState } from '../../shared/ui/empty-state';
import { CategoryIcon } from '../../shared/ui/category-icon';
import { AuthService } from '../../core/auth/auth.service';
import { Money } from '../../shared/ui/money';
import { CATEGORY_META, INVOICE_STATUS, categoryArt } from '../../shared/utils/labels';
import { LucideAngularModule } from 'lucide-angular';
import { I } from '../../shared/ui/icons';
import { BrlPipe } from '../../shared/utils/money.pipe';
import { MonthPipe } from '../../shared/utils/month.pipe';
import { monthName } from '../../shared/utils/dates';

const ONBOARDING_KEY = 'saldo-onboarding-hidden';

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    localStorage.setItem(key, '1');
  } catch {
    /* armazenamento indisponível */
  }
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, RouterLink, FormsModule, DecimalPipe, ButtonModule, CheckboxModule, SkeletonModule, TagModule, TooltipModule, Money,
    EmptyState, CategoryIcon, BrlPipe, MonthPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly state = inject(AppState);

  protected readonly data = rxResource({
    params: () => ({ month: this.state.month(), v: this.state.version() }),
    stream: ({ params }) => this.api.dashboard(params.month),
  });

  protected readonly categoryMeta = CATEGORY_META;
  protected readonly I = I;
  protected readonly invoiceStatus = INVOICE_STATUS;
  protected readonly monthName = computed(() => monthName(this.state.month()).toLowerCase());

  // ----- curva do saldo no mês -----
  /**
   * Projeção diária: começa com a renda do mês e desce a cada vencimento (contas e faturas);
   * os gastos do dia a dia são distribuídos ao longo do mês. O último ponto é o saldo previsto.
   */
  protected readonly curve = computed(() => {
    const d = this.data.value();
    if (!d || d.balance.income <= 0) return null;
    const [y, m] = this.state.month().split('-').map(Number);
    const days = new Date(y, m, 0).getDate();
    const W = 640;
    const H = 180;
    const PAD_TOP = 14;
    const PAD_BOTTOM = 18;

    const byDay = new Map<number, number>();
    for (const it of d.upcoming.items) byDay.set(it.dueDay, (byDay.get(it.dueDay) ?? 0) + it.amount);
    const dailyRate = d.balance.daily / days;

    const values: number[] = [d.balance.income];
    let v = d.balance.income;
    const steps: { day: number; before: number; after: number }[] = [];
    for (let day = 1; day <= days; day++) {
      v -= dailyRate;
      const before = v;
      v -= byDay.get(day) ?? 0;
      steps.push({ day, before, after: v });
      values.push(before, v);
    }
    const max = d.balance.income;
    const min = Math.min(0, ...values);
    const x = (day: number) => (day / days) * W;
    const yv = (val: number) => PAD_TOP + (1 - (val - min) / (max - min || 1)) * (H - PAD_TOP - PAD_BOTTOM);

    let path = `M0,${yv(max).toFixed(1)}`;
    for (const st of steps) {
      path += ` L${x(st.day).toFixed(1)},${yv(st.before).toFixed(1)}`;
      if (st.after !== st.before) path += ` L${x(st.day).toFixed(1)},${yv(st.after).toFixed(1)}`;
    }
    const area = `${path} L${W},${H} L0,${H} Z`;
    const markers = [...byDay.entries()]
      .filter(([day]) => day >= 1 && day <= days)
      .map(([day, amount]) => {
        const st = steps[day - 1];
        return { day, amount, x: x(day), y: yv(st.after) };
      });
    const now = new Date();
    const isCurrent = now.getFullYear() === y && now.getMonth() + 1 === m;
    return {
      W, H, path, area, markers, days,
      zeroY: min < 0 ? yv(0) : null,
      todayX: isCurrent ? x(now.getDate()) : null,
      end: { x: W, y: yv(v), value: v },
      negative: v < 0,
    };
  });

  protected readonly expenses = computed(() => {
    const b = this.data.value()?.balance;
    if (!b) return [];
    return [
      { label: 'Contas', value: b.bills },
      { label: 'Cartões', value: b.cards },
      { label: 'Dia a dia', value: b.daily },
    ];
  });

  // ----- gastos por categoria -----
  protected readonly spending = computed(() => {
    const s = this.data.value()?.spending;
    if (!s) return [];
    const top = s.categories.slice(0, 6);
    const rest = s.categories.slice(6);
    const list = top.map((c) => ({ key: c.category as string, label: CATEGORY_META[c.category].label, art: categoryArt(c.category),
      amount: c.amount, percent: c.percent, color: CATEGORY_META[c.category].color }));
    if (rest.length) {
      const amount = rest.reduce((t, c) => t + c.amount, 0);
      const percent = rest.reduce((t, c) => t + c.percent, 0);
      list.push({ key: 'rest', label: 'Outras categorias', art: '3d/package.webp', amount, percent, color: '#9aa39d' });
    }
    return list;
  });
  protected readonly topCategory = computed(() => this.spending()[0] ?? null);

  // ----- cartões -----
  protected readonly cardIndex = signal(0);
  protected readonly visibleCards = computed<Card[]>(() => {
    const cards = this.data.value()?.cards.cards ?? [];
    const start = Math.min(this.cardIndex(), Math.max(cards.length - 1, 0));
    return cards.slice(start, start + 2);
  });

  // ----- contas a pagar -----
  protected readonly dayFilter = signal<number | null>(null);
  protected readonly filteredItems = computed<UpcomingItem[]>(() => {
    const items = this.data.value()?.upcoming.items ?? [];
    const day = this.dayFilter();
    return day === null ? items : items.filter((i) => i.dueDay === day);
  });
  protected readonly daysToNext = computed(() => {
    const up = this.data.value()?.upcoming;
    if (!up) return null;
    const next = up.items.find((i) => !i.paid);
    if (!next) return null;
    const [y, m] = this.state.month().split('-').map(Number);
    const due = new Date(y, m - 1, next.dueDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / 86_400_000);
  });
  protected readonly dueLabel = computed(() => {
    const d = this.daysToNext();
    if (d === null) return '';
    if (d === 0) return 'vence hoje';
    const n = Math.abs(d);
    const days = n === 1 ? '1 dia' : `${n} dias`;
    return d < 0 ? `vencida há ${days}` : `em ${days}`;
  });
  protected readonly unpaidDays = computed(() => {
    const items = this.data.value()?.upcoming.items ?? [];
    const set = new Set(items.filter((i) => !i.paid).map((i) => i.dueDay));
    return set;
  });

  // ----- moradia -----
  protected readonly housingView = computed(() => {
    const h = this.data.value()?.housing;
    if (!h) return null;
    return {
      amount: h.amount,
      percent: h.percent,
      hasIncome: h.income > 0,
      ok: h.percent <= h.referencePercent,
      barPct: Math.min((h.percent / 60) * 100, 100),
      refPct: (h.referencePercent / 60) * 100,
      reference: h.referencePercent,
      items: h.items,
    };
  });

  // ----- primeiros passos -----
  private readonly auth = inject(AuthService);
  private readonly onboardingHidden = signal(readFlag(ONBOARDING_KEY));
  protected readonly firstName = computed(() => (this.auth.user()?.name ?? '').split(' ')[0]);
  protected readonly onboarding = computed(() => {
    const d = this.data.value();
    if (!d || this.onboardingHidden()) return null;
    const steps = [
      { label: 'Cadastre sua renda', art: '3d/dollar-banknote.webp', done: d.housing.income > 0, action: () => this.state.openQuickAdd('income') },
      { label: 'Adicione suas contas fixas', art: '3d/receipt.webp', done: d.upcoming.items.some((i) => i.kind === 'BILL'), action: () => this.state.openQuickAdd('bill') },
      { label: 'Cadastre um cartão', art: '3d/credit-card.webp', done: d.cards.cards.length > 0, action: () => this.router.navigateByUrl('/cartoes') },
      { label: 'Registre um gasto do dia', art: '3d/shopping-bags.webp', done: d.balance.daily > 0, action: () => this.state.openQuickAdd('cash') },
    ];
    const done = steps.filter((s) => s.done).length;
    return done === steps.length ? null : { steps, done };
  });

  protected dismissOnboarding(): void {
    this.onboardingHidden.set(true);
    writeFlag(ONBOARDING_KEY);
  }

  protected toggleItem(item: UpcomingItem): void {
    const m = this.state.month();
    let req: Observable<unknown>;
    if (item.kind === 'BILL') {
      req = item.paid ? this.api.unpayBill(item.id, m) : this.api.payBill(item.id, m);
    } else {
      req = item.paid ? this.api.unpayInvoice(item.id, m) : this.api.payInvoice(item.id, m);
    }
    req.subscribe(() => this.state.dataChanged());
  }

  protected openInvoices(): void {
    this.router.navigateByUrl('/cartoes');
  }

  protected shiftCards(delta: number): void {
    const len = this.data.value()?.cards.cards.length ?? 0;
    this.cardIndex.update((i) => Math.min(Math.max(i + delta, 0), Math.max(len - 1, 0)));
  }
}
