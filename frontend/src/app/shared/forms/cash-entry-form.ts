import { ChangeDetectionStrategy, Component, untracked, effect, inject, input, model, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';

import { ApiService } from '../../core/api/api.service';
import { CashEntry, CashEntryType, Category } from '../../core/api/models';
import { AppState } from '../../core/state/app-state.service';
import { fromIsoDate, toIsoDate, todayInMonth } from '../utils/dates';
import { CATEGORY_OPTIONS } from '../utils/labels';

@Component({
  selector: 'app-cash-entry-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule,
    SelectButtonModule, DatePickerModule],
  template: `
    <p-dialog [header]="entry() ? 'Editar lançamento' : 'Novo lançamento'" [visible]="visible()" (visibleChange)="visible.set($event)"
      [modal]="true" [style]="{ width: '480px' }" [breakpoints]="{ '640px': '95vw' }" [draggable]="false">
      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
        <div class="full">
          <p-selectbutton formControlName="type" [options]="types" optionLabel="label" optionValue="value" [allowEmpty]="false" />
        </div>
        <div class="full">
          <label for="c-desc">Descrição</label>
          <input pInputText id="c-desc" formControlName="description" class="w-full" placeholder="Ex.: Almoço" maxlength="120" />
        </div>
        <div>
          <label for="c-amount">Valor</label>
          <p-inputnumber inputId="c-amount" formControlName="amount" mode="currency" currency="BRL" locale="pt-BR" class="w-full" [min]="0" />
        </div>
        <div>
          <label for="c-date">Data</label>
          <p-datepicker inputId="c-date" formControlName="entryDate" dateFormat="dd/mm/yy" class="w-full" [readonlyInput]="true" />
        </div>
        <div class="full">
          <label for="c-cat">Categoria</label>
          <p-select inputId="c-cat" formControlName="category" [options]="categories" optionLabel="label" optionValue="value" class="w-full" [filter]="true" />
        </div>
        <div class="full dialog-actions">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="visible.set(false)" />
          <p-button type="submit" label="Salvar" icon="pi pi-check" [loading]="saving()" [disabled]="form.invalid" />
        </div>
      </form>
    </p-dialog>
  `,
})
export class CashEntryForm {
  private readonly api = inject(ApiService);
  private readonly state = inject(AppState);
  private readonly messages = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly visible = model(false);
  readonly entry = input<CashEntry | null>(null);

  protected readonly saving = signal(false);
  protected readonly categories = CATEGORY_OPTIONS;
  protected readonly types = [
    { label: 'Saída', value: 'SAIDA' as CashEntryType },
    { label: 'Entrada', value: 'ENTRADA' as CashEntryType },
  ];

  protected readonly form = this.fb.group({
    type: this.fb.nonNullable.control<CashEntryType>('SAIDA'),
    description: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    entryDate: this.fb.nonNullable.control<Date>(new Date(), Validators.required),
    category: this.fb.nonNullable.control<Category>('ALIMENTACAO', Validators.required),
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      untracked(() => {
        const e = this.entry();
        this.form.reset(
          e
            ? { type: e.type, description: e.description, amount: e.amount, entryDate: fromIsoDate(e.entryDate), category: e.category }
            : { type: 'SAIDA', description: '', amount: null, entryDate: todayInMonth(this.state.month()), category: 'ALIMENTACAO' },
        );
      });
    });
  }

  protected save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = { type: v.type, description: v.description.trim(), amount: v.amount!, entryDate: toIsoDate(v.entryDate), category: v.category };
    const e = this.entry();
    this.saving.set(true);
    (e ? this.api.updateCashEntry(e.id, body) : this.api.createCashEntry(body)).subscribe({
      next: () => {
        this.saving.set(false);
        this.messages.add({ severity: 'success', summary: 'Lançamento salvo' });
        this.state.dataChanged();
        this.visible.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
