import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { ApiService } from '../../core/api/api.service';
import { Bill, BillRequest, Category } from '../../core/api/models';
import { AppState } from '../../core/state/app-state.service';
import { fromYearMonth, toYearMonth } from '../utils/dates';
import { CATEGORY_OPTIONS } from '../utils/labels';

@Component({
  selector: 'app-bill-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule,
    ToggleSwitchModule, DatePickerModule],
  template: `
    <p-dialog [header]="bill() ? 'Editar conta' : 'Nova conta'" [visible]="visible()" (visibleChange)="visible.set($event)"
      [modal]="true" [style]="{ width: '520px' }" [breakpoints]="{ '640px': '95vw' }" [draggable]="false">
      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
        <div class="full">
          <label for="b-desc">Descrição</label>
          <input pInputText id="b-desc" formControlName="description" class="w-full" placeholder="Ex.: Aluguel" maxlength="120" />
        </div>
        <div>
          <label for="b-amount">Valor</label>
          <p-inputnumber inputId="b-amount" formControlName="amount" mode="currency" currency="BRL" locale="pt-BR" class="w-full" [min]="0" />
        </div>
        <div>
          <label for="b-due">Dia do vencimento</label>
          <p-inputnumber inputId="b-due" formControlName="dueDay" [min]="1" [max]="31" [showButtons]="true" class="w-full" />
        </div>
        <div class="full">
          <label for="b-cat">Categoria</label>
          <p-select inputId="b-cat" formControlName="category" [options]="categories" optionLabel="label" optionValue="value" class="w-full" [filter]="true" />
        </div>
        <div class="full switch-row">
          <div><div class="t">Custo de moradia</div><div class="d">Entra no cálculo "quanto custa morar" (aluguel, condomínio, luz…)</div></div>
          <p-toggleswitch formControlName="housing" />
        </div>
        <div class="full switch-row">
          <div><div class="t">Conta fixa (todo mês)</div><div class="d">Desligado = só no mês escolhido</div></div>
          <p-toggleswitch formControlName="recurring" />
        </div>
        <div>
          <label for="b-start">{{ isRecurring() ? 'A partir de' : 'Mês' }}</label>
          <p-datepicker inputId="b-start" formControlName="startMonth" view="month" dateFormat="mm/yy" class="w-full" [readonlyInput]="true" />
        </div>
        @if (isRecurring()) {
          <div>
            <label for="b-end">Até (opcional)</label>
            <p-datepicker inputId="b-end" formControlName="endMonth" view="month" dateFormat="mm/yy" class="w-full" [readonlyInput]="true" [showClear]="true" />
          </div>
        }
        <div class="full dialog-actions">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="visible.set(false)" />
          <p-button type="submit" label="Salvar" icon="pi pi-check" [loading]="saving()" [disabled]="form.invalid" />
        </div>
      </form>
    </p-dialog>
  `,
})
export class BillForm {
  private readonly api = inject(ApiService);
  private readonly state = inject(AppState);
  private readonly messages = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly visible = model(false);
  readonly bill = input<Bill | null>(null);
  readonly saved = output<void>();

  protected readonly saving = signal(false);
  protected readonly categories = CATEGORY_OPTIONS;

  protected readonly form = this.fb.group({
    description: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    dueDay: this.fb.nonNullable.control(5, [Validators.required, Validators.min(1), Validators.max(31)]),
    category: this.fb.nonNullable.control<Category>('MORADIA', Validators.required),
    housing: this.fb.nonNullable.control(false),
    recurring: this.fb.nonNullable.control(true),
    startMonth: this.fb.nonNullable.control<Date>(new Date(), Validators.required),
    endMonth: this.fb.control<Date | null>(null),
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly isRecurring = computed(() => !!this.formValue().recurring);

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      untracked(() => {
        const b = this.bill();
        this.form.reset(
          b
            ? { description: b.description, amount: b.amount, dueDay: b.dueDay, category: b.category, housing: b.housing,
                recurring: b.recurring, startMonth: fromYearMonth(b.startMonth), endMonth: b.endMonth ? fromYearMonth(b.endMonth) : null }
            : { description: '', amount: null, dueDay: 5, category: 'MORADIA', housing: false, recurring: true,
                startMonth: fromYearMonth(this.state.month()), endMonth: null },
        );
      });
    });
  }

  protected save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body: BillRequest = {
      description: v.description.trim(),
      amount: v.amount!,
      dueDay: v.dueDay,
      category: v.category,
      housing: v.housing,
      recurring: v.recurring,
      startMonth: toYearMonth(v.startMonth),
      endMonth: v.recurring && v.endMonth ? toYearMonth(v.endMonth) : null,
    };
    const b = this.bill();
    this.saving.set(true);
    (b ? this.api.updateBill(b.id, body) : this.api.createBill(body)).subscribe({
      next: () => {
        this.saving.set(false);
        this.messages.add({ severity: 'success', summary: 'Conta salva' });
        this.state.dataChanged();
        this.visible.set(false);
        this.saved.emit();
      },
      error: () => this.saving.set(false),
    });
  }
}
