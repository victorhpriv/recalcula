import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { of } from 'rxjs';

import { ApiService } from '../../core/api/api.service';
import { Card, InvoiceItem, Purchase } from '../../core/api/models';
import { AppState } from '../../core/state/app-state.service';
import { PurchaseForm } from '../../shared/forms/purchase-form';
import { Money } from '../../shared/ui/money';
import { CATEGORY_META, INVOICE_STATUS } from '../../shared/utils/labels';
import { BrlPipe } from '../../shared/utils/money.pipe';
import { MonthPipe } from '../../shared/utils/month.pipe';
import { CardForm } from './card-form';
import { Illustration } from '../../shared/ui/illustration';
import { EmptyState } from '../../shared/ui/empty-state';
import { CategoryIcon } from '../../shared/ui/category-icon';

@Component({
  selector: 'app-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Illustration, EmptyState, CategoryIcon, DatePipe, ButtonModule, ProgressBarModule, TagModule, Money, BrlPipe, MonthPipe, CardForm, PurchaseForm],
  templateUrl: './cards.html',
  styleUrl: './cards.scss',
})
export class CardsPage {
  private readonly api = inject(ApiService);
  private readonly confirm = inject(ConfirmationService);
  protected readonly state = inject(AppState);
  protected readonly meta = CATEGORY_META;
  protected readonly status = INVOICE_STATUS;

  protected readonly selectedId = signal<string | null>(null);
  protected readonly cardFormOpen = signal(false);
  protected readonly editingCard = signal<Card | null>(null);
  protected readonly purchaseFormOpen = signal(false);
  protected readonly editingPurchase = signal<Purchase | null>(null);

  protected readonly cards = rxResource({
    params: () => ({ month: this.state.month(), v: this.state.version() }),
    stream: ({ params }) => this.api.cards(params.month),
  });

  protected readonly selected = computed(() => {
    const list = this.cards.value() ?? [];
    return list.find((c) => c.id === this.selectedId()) ?? list[0] ?? null;
  });

  protected readonly invoice = rxResource({
    params: () => ({ id: this.selected()?.id, month: this.state.month(), v: this.state.version() }),
    stream: ({ params }) => (params.id ? this.api.invoice(params.id, params.month) : of(null)),
  });

  protected readonly upcoming = rxResource({
    params: () => ({ id: this.selected()?.id, month: this.state.month(), v: this.state.version() }),
    stream: ({ params }) => (params.id ? this.api.upcomingInvoices(params.id, params.month, 6) : of([])),
  });

  protected readonly purchases = rxResource({
    params: () => ({ id: this.selected()?.id, v: this.state.version() }),
    stream: ({ params }) => (params.id ? this.api.purchases(params.id) : of([])),
  });

  protected readonly usedPct = computed(() => {
    const c = this.selected();
    return c && c.creditLimit > 0 ? Math.min(Math.round((c.used / c.creditLimit) * 100), 100) : 0;
  });

  constructor() {
    // Mantém a seleção válida quando a lista muda (ex.: cartão arquivado).
    effect(() => {
      const list = this.cards.value() ?? [];
      if (this.selectedId() && !list.some((c) => c.id === this.selectedId())) this.selectedId.set(null);
    });
  }

  protected openCard(card: Card | null): void {
    this.editingCard.set(card);
    this.cardFormOpen.set(true);
  }

  protected openPurchase(p: Purchase | null): void {
    this.editingPurchase.set(p);
    this.purchaseFormOpen.set(true);
  }

  protected editFromItem(item: InvoiceItem): void {
    const p = (this.purchases.value() ?? []).find((x) => x.id === item.purchaseId);
    if (p) this.openPurchase(p);
  }

  protected togglePaid(): void {
    const c = this.selected();
    const inv = this.invoice.value();
    if (!c || !inv) return;
    const m = this.state.month();
    (inv.summary.status === 'PAGA' ? this.api.unpayInvoice(c.id, m) : this.api.payInvoice(c.id, m)).subscribe(() =>
      this.state.dataChanged(),
    );
  }

  protected archive(c: Card): void {
    this.confirm.confirm({
      header: 'Remover cartão',
      message: `Remover "${c.name}"? O histórico é mantido, mas o cartão deixa de aparecer.`,
      icon: 'pi pi-trash',
      acceptButtonProps: { label: 'Remover', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', text: true },
      accept: () => this.api.archiveCard(c.id).subscribe(() => this.state.dataChanged()),
    });
  }

  protected removePurchase(p: Purchase): void {
    this.confirm.confirm({
      header: 'Excluir compra',
      message: `Excluir "${p.description}"? Todas as parcelas serão removidas.`,
      icon: 'pi pi-trash',
      acceptButtonProps: { label: 'Excluir', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', text: true },
      accept: () => this.api.deletePurchase(p.cardId, p.id).subscribe(() => this.state.dataChanged()),
    });
  }
}
