import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { ApiService } from '../../core/api/api.service';
import { Bill } from '../../core/api/models';
import { AppState } from '../../core/state/app-state.service';
import { BillForm } from '../../shared/forms/bill-form';
import { Money } from '../../shared/ui/money';
import { CATEGORY_META } from '../../shared/utils/labels';
import { BrlPipe } from '../../shared/utils/money.pipe';
import { MonthPipe } from '../../shared/utils/month.pipe';
import { Illustration } from '../../shared/ui/illustration';
import { EmptyState } from '../../shared/ui/empty-state';
import { CategoryIcon } from '../../shared/ui/category-icon';

@Component({
  selector: 'app-bills',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Illustration, EmptyState, CategoryIcon, FormsModule, ButtonModule, CheckboxModule, TableModule, TagModule, TooltipModule,
    Money, BrlPipe, MonthPipe, BillForm],
  template: `
    <div class="page-header">
      <div class="page-hero"><app-illustration name="receipt" /><div>
        <h1>Contas</h1>
        <p>Contas fixas e avulsas de {{ state.monthLabel() }}. Marque como pagas conforme for quitando.</p>
      </div></div>
      <p-button label="Nova conta" icon="pi pi-plus" (onClick)="open(null)" />
    </div>

    <div class="kpis rise">
      <div class="panel kpi"><div class="label">Total no mês</div><app-money [value]="totals().total" size="md" /></div>
      <div class="panel kpi"><div class="label">Já pago</div><app-money [value]="totals().paid" size="md" /></div>
      <div class="panel kpi"><div class="label">Falta pagar</div><app-money [value]="totals().pending" size="md" /></div>
    </div>

    <section class="panel">
      <p-table [value]="rows()" [loading]="data.isLoading()" dataKey="id" [tableStyle]="{ 'min-width': '560px' }" styleClass="p-datatable-sm">
        <ng-template #header>
          <tr>
            <th style="width: 3rem">Pago</th>
            <th>Descrição</th>
            <th>Vence</th>
            <th style="text-align: right">Valor</th>
            <th style="width: 6rem"></th>
          </tr>
        </ng-template>
        <ng-template #body let-row>
          @let b = asBill(row);
          <tr [class.paid]="b.paid">
            <td><p-checkbox [binary]="true" [ngModel]="b.paid" (onChange)="togglePaid(b)" /></td>
            <td>
              <div class="row"><app-category-icon [category]="b.category" [size]="30" /><div>
              <div class="desc">{{ b.description }}</div>
              <div class="tags">
                <span class="faint">{{ meta[b.category].label }}</span>
                @if (b.housing) { <p-tag value="Moradia" severity="info" /> }
                @if (!b.recurring) { <p-tag value="Avulsa" severity="warn" /> }
                @else if (b.endMonth) { <span class="faint">até {{ b.endMonth | month: 'short' }}</span> }
              </div>
              </div></div>
            </td>
            <td>dia {{ b.dueDay }}</td>
            <td style="text-align: right; font-weight: 700">{{ b.amount | brl }}</td>
            <td>
              <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="open(b)" ariaLabel="Editar" />
              <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="remove(b)" ariaLabel="Excluir" />
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr><td colspan="5"><app-empty-state illustration="receipt" title="Nenhuma conta neste mês" text="Cadastre aluguel, luz, internet, assinaturas… As contas fixas se repetem sozinhas todo mês."><p-button label="Nova conta" icon="pi pi-plus" size="small" (onClick)="open(null)" /></app-empty-state></td></tr>
        </ng-template>
      </p-table>
    </section>

    <app-bill-form [(visible)]="formOpen" [bill]="editing()" />
  `,
  styles: `
    .desc { font-weight: 600; }
    .tags { display: flex; gap: 0.4rem; align-items: center; font-size: 0.7rem; margin-top: 0.2rem; flex-wrap: wrap; }
    .tags i { font-size: 0.65rem; }
    tr.paid .desc { text-decoration: line-through; color: var(--app-text-3); }
    :host ::ng-deep .p-datatable { overflow-x: auto; }
  `,
})
export class BillsPage {
  private readonly api = inject(ApiService);
  private readonly confirm = inject(ConfirmationService);
  protected readonly state = inject(AppState);
  protected readonly meta = CATEGORY_META;

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Bill | null>(null);

  protected readonly data = rxResource({
    params: () => ({ month: this.state.month(), v: this.state.version() }),
    stream: ({ params }) => this.api.bills(params.month),
  });

  protected readonly rows = computed(() => this.data.value() ?? []);

  protected readonly totals = computed(() => {
    const rows = this.rows();
    const total = rows.reduce((s, b) => s + b.amount, 0);
    const paid = rows.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0);
    return { total, paid, pending: total - paid };
  });

  protected asBill(row: unknown): Bill {
    return row as Bill;
  }

  protected open(bill: Bill | null): void {
    this.editing.set(bill);
    this.formOpen.set(true);
  }

  protected togglePaid(b: Bill): void {
    const m = this.state.month();
    (b.paid ? this.api.unpayBill(b.id, m) : this.api.payBill(b.id, m)).subscribe(() => this.state.dataChanged());
  }

  protected remove(b: Bill): void {
    this.confirm.confirm({
      header: 'Excluir conta',
      message: b.recurring
        ? `"${b.description}" é uma conta fixa. Excluir remove ela de todos os meses. Para encerrar a partir de um mês, edite e defina o mês final.`
        : `Excluir "${b.description}"?`,
      icon: 'pi pi-trash',
      acceptButtonProps: { label: 'Excluir', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', text: true },
      accept: () => this.api.deleteBill(b.id).subscribe(() => this.state.dataChanged()),
    });
  }
}
