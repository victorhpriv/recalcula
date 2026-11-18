import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { ApiService } from '../../core/api/api.service';
import { CashEntry } from '../../core/api/models';
import { AppState } from '../../core/state/app-state.service';
import { CashEntryForm } from '../../shared/forms/cash-entry-form';
import { Money } from '../../shared/ui/money';
import { CATEGORY_META } from '../../shared/utils/labels';
import { BrlPipe } from '../../shared/utils/money.pipe';
import { EmptyState } from '../../shared/ui/empty-state';
import { CategoryIcon } from '../../shared/ui/category-icon';

@Component({
  selector: 'app-cash-flow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, CategoryIcon, DatePipe, ButtonModule, SkeletonModule, Money, BrlPipe, CashEntryForm],
  template: `
    <div class="page-header">
      <div class="page-hero">
        <div>
          <h1>Fluxo de caixa</h1>
          <p>Gastos e entradas do dia a dia em {{ state.monthLabel() }}.</p>
        </div>
      </div>
      <p-button label="Novo lançamento" icon="pi pi-plus" (onClick)="open(null)" />
    </div>

    @if (data.value(); as d) {
      <div class="kpis rise">
        <div class="panel kpi"><div class="label">Entradas</div><app-money [value]="d.totalIn" size="md" /></div>
        <div class="panel kpi"><div class="label">Saídas</div><app-money [value]="d.totalOut" size="md" /></div>
        <div class="panel kpi"><div class="label">Saldo do dia a dia</div><app-money [value]="d.balance" size="md" /></div>
      </div>

      <div class="cols">
        <section class="panel">
          <div class="panel-title">Lançamentos</div>
          @for (group of grouped(); track group.date) {
            <div class="day-title">{{ group.date | date: "EEEE, dd 'de' MMMM" }}</div>
            @for (e of group.items; track e.id) {
              <div class="list-row">
                <app-category-icon [category]="e.category" />
                <div class="grow">
                  <div style="font-weight: 600">{{ e.description }}</div>
                  <div class="faint" style="font-size: 0.72rem">{{ meta[e.category].label }}</div>
                </div>
                <span class="amount" [class.text-green]="e.type === 'ENTRADA'">{{ e.type === 'ENTRADA' ? '+' : '−' }} {{ e.amount | brl }}</span>
                <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="open(e)" ariaLabel="Editar" />
                <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="remove(e)" ariaLabel="Excluir" />
              </div>
            }
          } @empty {
            <app-empty-state illustration="flow" title="Nenhum lançamento neste mês" text="Anote cafés, almoços, Uber e compras rápidas para saber exatamente quanto sobra.">
              <p-button label="Novo lançamento" icon="pi pi-plus" size="small" (onClick)="open(null)" />
            </app-empty-state>
          }
        </section>

        <section class="panel">
          <div class="panel-title">Saídas por categoria</div>
          @for (c of d.outByCategory; track c.category) {
            <div class="cat-row">
              <div class="between"><span class="row"><app-category-icon [category]="c.category" [size]="26" /> {{ meta[c.category].label }}</span><b>{{ c.amount | brl }}</b></div>
              <div class="bar"><span [style.width.%]="(c.amount / d.totalOut) * 100" [style.background]="meta[c.category].color"></span></div>
            </div>
          } @empty {
            <app-empty-state illustration="chart" title="Sem saídas registradas" [compact]="true" />
          }
        </section>
      </div>
    } @else if (data.isLoading()) {
      <p-skeleton height="320px" borderRadius="18px" />
    }

    <app-cash-entry-form [(visible)]="formOpen" [entry]="editing()" />
  `,
  styles: `
    .cols { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; align-items: start; }
    .day-title { font-size: 0.75rem; color: var(--app-text-2); margin: 1.1rem 0 0.15rem; font-weight: 600; }
    .day-title::first-letter { text-transform: uppercase; }
    .cat-icon { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; background: var(--app-red-soft); color: var(--app-red); flex-shrink: 0; }
    .cat-icon.in { background: var(--app-green-soft); color: var(--app-green); }
    .cat-icon i { font-size: 0.8rem; }
    .cat-row { margin-top: 0.9rem; font-size: 0.8rem; }
    .bar { height: 6px; background: var(--app-surface-2); border-radius: 9px; margin-top: 0.35rem; overflow: hidden; }
    .bar span { display: block; height: 100%; background: var(--app-primary); border-radius: 9px; }
    @media (max-width: 900px) { .cols { grid-template-columns: 1fr; } }
  `,
})
export class CashFlowPage {
  private readonly api = inject(ApiService);
  private readonly confirm = inject(ConfirmationService);
  protected readonly state = inject(AppState);
  protected readonly meta = CATEGORY_META;

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<CashEntry | null>(null);

  protected readonly data = rxResource({
    params: () => ({ month: this.state.month(), v: this.state.version() }),
    stream: ({ params }) => this.api.cashFlow(params.month),
  });

  protected readonly grouped = computed(() => {
    const groups = new Map<string, CashEntry[]>();
    for (const e of this.data.value()?.entries ?? []) {
      groups.set(e.entryDate, [...(groups.get(e.entryDate) ?? []), e]);
    }
    return [...groups.entries()].map(([date, items]) => ({ date, items }));
  });

  protected open(entry: CashEntry | null): void {
    this.editing.set(entry);
    this.formOpen.set(true);
  }

  protected remove(entry: CashEntry): void {
    this.confirm.confirm({
      header: 'Excluir lançamento',
      message: `Excluir "${entry.description}"?`,
      icon: 'pi pi-trash',
      acceptButtonProps: { label: 'Excluir', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', text: true },
      accept: () => this.api.deleteCashEntry(entry.id).subscribe(() => this.state.dataChanged()),
    });
  }
}
