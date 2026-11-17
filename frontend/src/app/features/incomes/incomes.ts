import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { ApiService } from '../../core/api/api.service';
import { Income } from '../../core/api/models';
import { AppState } from '../../core/state/app-state.service';
import { IncomeForm } from '../../shared/forms/income-form';
import { Money } from '../../shared/ui/money';
import { INCOME_TYPE_OPTIONS } from '../../shared/utils/labels';
import { BrlPipe } from '../../shared/utils/money.pipe';
import { MonthPipe } from '../../shared/utils/month.pipe';
import { Illustration } from '../../shared/ui/illustration';
import { EmptyState } from '../../shared/ui/empty-state';

@Component({
  selector: 'app-incomes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Illustration, EmptyState, ButtonModule, TagModule, Money, BrlPipe, MonthPipe, IncomeForm],
  template: `
    <div class="page-header">
      <div class="page-hero"><app-illustration name="money" />
        <div>
          <h1>Renda</h1>
          <p>Salário e outras entradas fixas ou avulsas, usados para calcular o seu saldo do mês.</p>
        </div>
      </div>
      <p-button label="Nova renda" icon="pi pi-plus" (onClick)="open(null)" />
    </div>

    <div class="kpis rise">
      <div class="panel kpi"><div class="label">Renda em {{ state.monthLabel() }}</div><app-money [value]="total()" size="md" /></div>
      <div class="panel kpi"><div class="label">Fontes ativas no mês</div><div class="value">{{ activeCount() }}</div></div>
    </div>

    <section class="panel">
      <div class="panel-title">Rendas cadastradas</div>
      @for (i of data.value() ?? []; track i.id) {
        <div class="list-row" [class.inactive]="!i.activeInMonth">
          <span class="inc-icon"><i class="pi pi-arrow-down-left"></i></span>
          <div class="grow">
            <div style="font-weight: 600">{{ i.description }}</div>
            <div class="faint" style="font-size: 0.72rem">
              {{ typeLabel(i) }} ·
              @if (i.recurring) { mensal desde {{ i.startMonth | month: 'short' }}@if (i.endMonth) { até {{ i.endMonth | month: 'short' }} } }
              @else { só em {{ i.startMonth | month: 'short' }} }
            </div>
          </div>
          @if (!i.activeInMonth) { <p-tag value="Fora deste mês" severity="secondary" /> }
          <span class="amount">{{ i.amount | brl }}</span>
          <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="open(i)" ariaLabel="Editar" />
          <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="remove(i)" ariaLabel="Excluir" />
        </div>
      } @empty {
        <app-empty-state illustration="money" title="Nenhuma renda cadastrada" text="Comece pelo seu salário: ele é a base para calcular quanto sobra no mês.">
          <p-button label="Cadastrar renda" icon="pi pi-plus" size="small" (onClick)="open(null)" />
        </app-empty-state>
      }
    </section>

    <app-income-form [(visible)]="formOpen" [income]="editing()" />
  `,
  styles: `
    .inactive { opacity: 0.55; }
    .inc-icon { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; background: var(--app-green-soft); color: var(--app-green); flex-shrink: 0; }
    .inc-icon i { font-size: 0.8rem; }
  `,
})
export class IncomesPage {
  private readonly api = inject(ApiService);
  private readonly confirm = inject(ConfirmationService);
  protected readonly state = inject(AppState);

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Income | null>(null);

  protected readonly data = rxResource({
    params: () => ({ month: this.state.month(), v: this.state.version() }),
    stream: ({ params }) => this.api.incomes(params.month),
  });

  protected readonly total = computed(() =>
    (this.data.value() ?? []).filter((i) => i.activeInMonth).reduce((s, i) => s + i.amount, 0),
  );

  protected readonly activeCount = computed(() => (this.data.value() ?? []).filter((i) => i.activeInMonth).length);

  protected typeLabel(i: Income): string {
    return INCOME_TYPE_OPTIONS.find((o) => o.value === i.type)?.label ?? i.type;
  }

  protected open(income: Income | null): void {
    this.editing.set(income);
    this.formOpen.set(true);
  }

  protected remove(i: Income): void {
    this.confirm.confirm({
      header: 'Excluir renda',
      message: `Excluir "${i.description}"?`,
      icon: 'pi pi-trash',
      acceptButtonProps: { label: 'Excluir', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', text: true },
      accept: () => this.api.deleteIncome(i.id).subscribe(() => this.state.dataChanged()),
    });
  }
}
