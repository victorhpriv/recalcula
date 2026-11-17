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
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { ApiService } from '../../core/api/api.service';
import { Income, IncomeType } from '../../core/api/models';
import { AppState } from '../../core/state/app-state.service';
import { fromYearMonth, toYearMonth } from '../utils/dates';
import { INCOME_TYPE_OPTIONS } from '../utils/labels';

@Component({
  selector: 'app-income-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule,
    ToggleSwitchModule, DatePickerModule],
  template: `
    <p-dialog [header]="income() ? 'Editar renda' : 'Nova renda'" [visible]="visible()" (visibleChange)="visible.set($event)"
      [modal]="true" [style]="{ width: '500px' }" [breakpoints]="{ '640px': '95vw' }" [draggable]="false">
      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
        <div class="full">
          <label for="i-desc">Descrição</label>
          <input pInputText id="i-desc" formControlName="description" class="w-full" placeholder="Ex.: Salário" maxlength="120" />
        </div>
        <div>
          <label for="i-amount">Valor</label>
          <p-inputnumber inputId="i-amount" formControlName="amount" mode="currency" currency="BRL" locale="pt-BR" class="w-full" [min]="0" />
        </div>
        <div>
          <label for="i-type">Tipo</label>
          <p-select inputId="i-type" formControlName="type" [options]="types" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="full switch-row">
          <div><div class="t">Renda fixa (todo mês)</div><div class="d">Desligado = só no mês escolhido</div></div>
          <p-toggleswitch formControlName="recurring" />
        </div>
        <div>
          <label for="i-start">{{ isRecurring() ? 'A partir de' : 'Mês' }}</label>
          <p-datepicker inputId="i-start" formControlName="startMonth" view="month" dateFormat="mm/yy" class="w-full" [readonlyInput]="true" />
        </div>
        @if (isRecurring()) {
          <div>
            <label for="i-end">Até (opcional)</label>
            <p-datepicker inputId="i-end" formControlName="endMonth" view="month" dateFormat="mm/yy" class="w-full" [readonlyInput]="true" [showClear]="true" />
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
export class IncomeForm {
  private readonly api = inject(ApiService);
  private readonly state = inject(AppState);
  private readonly messages = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly visible = model(false);
  readonly income = input<Income | null>(null);

  protected readonly saving = signal(false);
  protected readonly types = INCOME_TYPE_OPTIONS;

  protected readonly form = this.fb.group({
    description: this.fb.nonNullable.control('Salário', [Validators.required, Validators.maxLength(120)]),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    type: this.fb.nonNullable.control<IncomeType>('SALARIO'),
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
        const i = this.income();
        this.form.reset(
          i
            ? { description: i.description, amount: i.amount, type: i.type, recurring: i.recurring,
                startMonth: fromYearMonth(i.startMonth), endMonth: i.endMonth ? fromYearMonth(i.endMonth) : null }
            : { description: 'Salário', amount: null, type: 'SALARIO', recurring: true,
                startMonth: fromYearMonth(this.state.month()), endMonth: null },
        );
      });
    });
  }

  protected save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = {
      description: v.description.trim(), amount: v.amount!, type: v.type, recurring: v.recurring,
      startMonth: toYearMonth(v.startMonth), endMonth: v.recurring && v.endMonth ? toYearMonth(v.endMonth) : null,
    };
    const i = this.income();
    this.saving.set(true);
    (i ? this.api.updateIncome(i.id, body) : this.api.createIncome(body)).subscribe({
      next: () => {
        this.saving.set(false);
        this.messages.add({ severity: 'success', summary: 'Renda salva' });
        this.state.dataChanged();
        this.visible.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
