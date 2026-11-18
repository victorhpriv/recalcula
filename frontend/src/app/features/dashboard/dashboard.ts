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
import { Illustration } from '../../shared/ui/illustration';
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
    Illustration, EmptyState, CategoryIcon, BrlPipe, MonthPipe],
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

  // ----- saldo -----
  protected readonly balanceBar = computed(() => {
    const b = this.data.value()?.balance;
    if (!b || b.income <= 0) return [];
    const segs = [
      { key: 'bills', label: 'Contas', value: b.bills, color: 'var(--app-navy)' },
      { key: 'cards', label: 'Cartões', value: b.cards, color: 'var(--app-primary)' },
      { key: 'daily', label: 'Dia a dia', value: b.daily, color: '#9db4ff' },
      { key: 'free', label: 'Sobra', value: Math.max(b.projected, 0), color: 'var(--app-green)' },
    ];
    const total = Math.max(b.income, segs.reduce((s, x) => s + x.value, 0));
    return segs.map((s) => ({ ...s, pct: (s.value / total) * 100 }));
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
      list.push({ key: 'rest', label: 'Outras categorias', art: '3d/package.webp', amount, percent, color: '#9aa1b2' });
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
  protected readonly nextChart = computed(() => {
    const next = this.data.value()?.cards.next ?? [];
    const max = Math.max(...next.map((n) => n.amount), 1);
    return next.map((n, i) => ({ ...n, x: 50 + i * 100, y: 40 - (n.amount / max) * 28 }));
  });
  protected readonly nextChartPath = computed(() => this.nextChart().map((p) => `${p.x},${p.y}`).join(' '));

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
