import { ChangeDetectionStrategy, Component, untracked, computed, effect, inject, input, model, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { ApiService } from '../../core/api/api.service';
import { Card, Category, Purchase } from '../../core/api/models';
import { AppState } from '../../core/state/app-state.service';
import { fromIsoDate, toIsoDate } from '../utils/dates';
import { CATEGORY_OPTIONS } from '../utils/labels';
import { formatBRL } from '../utils/money.pipe';

@Component({
  selector: 'app-purchase-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, DatePickerModule],
  template: `
    <p-dialog [header]="purchase() ? 'Editar compra' : 'Nova compra no cartão'" [visible]="visible()" (visibleChange)="visible.set($event)"
      [modal]="true" [style]="{ width: '500px' }" [breakpoints]="{ '640px': '95vw' }" [draggable]="false">
      @if (!purchase() && cards().length === 0) {
        <div class="empty"><img src="3d/credit-card.webp" width="64" height="64" alt="" style="margin: 0 auto 0.5rem" />Cadastre um cartão primeiro na tela <b>Cartões</b>.</div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
          <div class="full">
            <label for="p-card">Cartão</label>
            <p-select inputId="p-card" formControlName="cardId" [options]="cards()" optionLabel="name" optionValue="id" class="w-full" />
          </div>
          <div class="full">
            <label for="p-desc">Descrição</label>
            <input pInputText id="p-desc" formControlName="description" class="w-full" placeholder="Ex.: Geladeira" maxlength="120" />
          </div>
          <div>
            <label for="p-amount">Valor total</label>
            <p-inputnumber inputId="p-amount" formControlName="totalAmount" mode="currency" currency="BRL" locale="pt-BR" class="w-full" [min]="0" />
          </div>
          <div>
            <label for="p-inst">Parcelas</label>
            <p-inputnumber inputId="p-inst" formControlName="installments" [min]="1" [max]="48" [showButtons]="true" class="w-full" />
            @if (installmentHint()) { <div class="hint">{{ installmentHint() }}</div> }
          </div>
          <div>
            <label for="p-date">Data da compra</label>
            <p-datepicker inputId="p-date" formControlName="purchaseDate" dateFormat="dd/mm/yy" class="w-full" [maxDate]="today" [readonlyInput]="true" />
          </div>
          <div>
            <label for="p-cat">Categoria</label>
            <p-select inputId="p-cat" formControlName="category" [options]="categories" optionLabel="label" optionValue="value" class="w-full" [filter]="true" />
          </div>
          <div class="full dialog-actions">
            <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="visible.set(false)" />
            <p-button type="submit" label="Salvar" icon="pi pi-check" [loading]="saving()" [disabled]="form.invalid" />
          </div>
        </form>
      }
    </p-dialog>
  `,
})
export class PurchaseForm {
  private readonly api = inject(ApiService);
  private readonly state = inject(AppState);
  private readonly messages = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly visible = model(false);
  readonly purchase = input<Purchase | null>(null);
  readonly cardId = input<string | null>(null);

  protected readonly saving = signal(false);
  protected readonly cards = signal<Card[]>([]);
  protected readonly categories = CATEGORY_OPTIONS;
  protected readonly today = new Date();

  protected readonly form = this.fb.group({
    cardId: this.fb.control<string | null>(null, Validators.required),
    description: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    totalAmount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    installments: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1), Validators.max(48)]),
    purchaseDate: this.fb.nonNullable.control<Date>(new Date(), Validators.required),
    category: this.fb.nonNullable.control<Category>('COMPRAS', Validators.required),
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly installmentHint = computed(() => {
    const v = this.formValue();
    if (!v.totalAmount || !v.installments || v.installments < 2) return '';
    return `${v.installments}x de ${formatBRL(v.totalAmount / v.installments)}`;
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      untracked(() => {
        const p = this.purchase();
        const preselected = p?.cardId ?? this.cardId();
        this.api.cards(this.state.month()).subscribe((cards) => {
          this.cards.set(cards);
          if (!this.form.controls.cardId.value && cards.length) this.form.patchValue({ cardId: cards[0].id });
        });
        this.form.reset(
          p
            ? { cardId: p.cardId, description: p.description, totalAmount: p.totalAmount, installments: p.installments,
                purchaseDate: fromIsoDate(p.purchaseDate), category: p.category }
            : { cardId: preselected, description: '', totalAmount: null, installments: 1, purchaseDate: new Date(), category: 'COMPRAS' },
        );
        if (p) this.form.controls.cardId.disable();
        else this.form.controls.cardId.enable();
      });
    });
  }

  protected save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = {
      description: v.description.trim(), totalAmount: v.totalAmount!, installments: v.installments,
      purchaseDate: toIsoDate(v.purchaseDate), category: v.category,
    };
    const p = this.purchase();
    this.saving.set(true);
    (p ? this.api.updatePurchase(p.cardId, p.id, body) : this.api.addPurchase(v.cardId!, body)).subscribe({
      next: () => {
        this.saving.set(false);
        this.messages.add({ severity: 'success', summary: 'Compra salva' });
        this.state.dataChanged();
        this.visible.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
