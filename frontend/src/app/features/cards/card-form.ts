import { ChangeDetectionStrategy, Component, effect, inject, input, model, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';

import { ApiService } from '../../core/api/api.service';
import { Card } from '../../core/api/models';
import { AppState } from '../../core/state/app-state.service';
import { CARD_COLORS } from '../../shared/utils/labels';

@Component({
  selector: 'app-card-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule],
  template: `
    <p-dialog [header]="card() ? 'Editar cartão' : 'Novo cartão'" [visible]="visible()" (visibleChange)="visible.set($event)"
      [modal]="true" [style]="{ width: '500px' }" [breakpoints]="{ '640px': '95vw' }" [draggable]="false">
      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
        <div>
          <label for="cc-name">Apelido</label>
          <input pInputText id="cc-name" formControlName="name" class="w-full" placeholder="Ex.: Unique" maxlength="60" />
        </div>
        <div>
          <label for="cc-bank">Banco</label>
          <input pInputText id="cc-bank" formControlName="bank" class="w-full" placeholder="Ex.: Santander" maxlength="60" />
        </div>
        <div class="full">
          <label for="cc-limit">Limite</label>
          <p-inputnumber inputId="cc-limit" formControlName="creditLimit" mode="currency" currency="BRL" locale="pt-BR" class="w-full" [min]="0" />
        </div>
        <div>
          <label for="cc-close">Dia do fechamento</label>
          <p-inputnumber inputId="cc-close" formControlName="closingDay" [min]="1" [max]="31" [showButtons]="true" class="w-full" />
        </div>
        <div>
          <label for="cc-due">Dia do vencimento</label>
          <p-inputnumber inputId="cc-due" formControlName="dueDay" [min]="1" [max]="31" [showButtons]="true" class="w-full" />
        </div>
        <div class="full">
          <label>Cor</label>
          <div class="colors">
            @for (c of colors; track c) {
              <button type="button" class="color" [style.background]="c" [class.on]="form.controls.color.value === c"
                (click)="form.controls.color.setValue(c)" [attr.aria-label]="'Cor ' + c"></button>
            }
          </div>
        </div>
        <div class="full hint">Por segurança, não pedimos número, validade nem CVV do cartão.</div>
        <div class="full dialog-actions">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="visible.set(false)" />
          <p-button type="submit" label="Salvar" icon="pi pi-check" [loading]="saving()" [disabled]="form.invalid" />
        </div>
      </form>
    </p-dialog>
  `,
  styles: `
    .colors { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .color { width: 30px; height: 30px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; outline: 2px solid transparent; }
    .color.on { outline-color: var(--app-primary); border-color: var(--app-surface); }
  `,
})
export class CardForm {
  private readonly api = inject(ApiService);
  private readonly state = inject(AppState);
  private readonly messages = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly visible = model(false);
  readonly card = input<Card | null>(null);

  protected readonly saving = signal(false);
  protected readonly colors = CARD_COLORS;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    bank: ['', [Validators.required, Validators.maxLength(60)]],
    creditLimit: [0, [Validators.required, Validators.min(0)]],
    closingDay: [28, [Validators.required, Validators.min(1), Validators.max(31)]],
    dueDay: [5, [Validators.required, Validators.min(1), Validators.max(31)]],
    color: [CARD_COLORS[0], Validators.required],
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      untracked(() => {
        const c = this.card();
        this.form.reset(
          c
            ? { name: c.name, bank: c.bank, creditLimit: c.creditLimit, closingDay: c.closingDay, dueDay: c.dueDay, color: c.color }
            : { name: '', bank: '', creditLimit: 0, closingDay: 28, dueDay: 5, color: CARD_COLORS[0] },
        );
      });
    });
  }

  protected save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = { ...v, name: v.name.trim(), bank: v.bank.trim() };
    const c = this.card();
    this.saving.set(true);
    (c ? this.api.updateCard(c.id, body) : this.api.createCard(body)).subscribe({
      next: () => {
        this.saving.set(false);
        this.messages.add({ severity: 'success', summary: 'Cartão salvo' });
        this.state.dataChanged();
        this.visible.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
