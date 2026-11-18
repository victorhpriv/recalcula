import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectButtonModule } from 'primeng/selectbutton';

import { ApiService } from '../../core/api/api.service';
import { Goal, Movement, ReserveOverview } from '../../core/api/models';
import { AppState } from '../../core/state/app-state.service';
import { Money } from '../../shared/ui/money';
import { toIsoDate } from '../../shared/utils/dates';
import { GOAL_COLORS } from '../../shared/utils/labels';
import { BrlPipe } from '../../shared/utils/money.pipe';
import { Illustration } from '../../shared/ui/illustration';
import { EmptyState } from '../../shared/ui/empty-state';

@Component({
  selector: 'app-reserve',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Illustration, EmptyState, DatePipe, ReactiveFormsModule, ButtonModule, DialogModule, InputTextModule, InputNumberModule, DatePickerModule,
    ProgressBarModule, SelectButtonModule, Money, BrlPipe],
  template: `
    <div class="page-header">
      <div class="page-hero"><app-illustration name="piggy" />
        <div>
          <h1>Reserva</h1>
          <p>Reserva de emergência e objetivos (viagem, carro, estudos…).</p>
        </div>
      </div>
      <p-button label="Novo objetivo" icon="pi pi-plus" (onClick)="openGoal(null)" />
    </div>

    @if (data.value(); as d) {
      <div class="kpis"><div class="panel kpi"><div class="label">Total guardado</div><app-money [value]="d.total" size="lg" /></div></div>

      <div class="goals rise">
        @for (g of d.goals; track g.id) {
          <section class="panel goal">
            <div class="between">
              <div class="row"><span class="g-dot" [style.background]="g.color"></span><b>{{ g.name }}</b></div>
              <div class="row">
                <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="openGoal(g)" ariaLabel="Editar" />
                <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="removeGoal(g)" ariaLabel="Excluir" />
              </div>
            </div>
            <app-money [value]="g.saved" size="md" />
            <div class="faint" style="font-size: 0.75rem">de {{ g.targetAmount | brl }} · {{ g.percent }}%</div>
            <div class="bar"><span [style.width.%]="g.percent > 100 ? 100 : g.percent" [style.background]="g.color"></span></div>
            <div class="row" style="margin-top: 0.75rem">
              <p-button label="Guardar" icon="pi pi-plus" size="small" (onClick)="openMovement(g, 'APORTE')" />
              <p-button label="Resgatar" icon="pi pi-minus" size="small" severity="secondary" [outlined]="true" (onClick)="openMovement(g, 'RESGATE')" [disabled]="g.saved <= 0" />
            </div>
          </section>
        } @empty {
          <div class="panel" style="grid-column: 1 / -1">
            <app-empty-state illustration="piggy" title="Comece sua reserva" text="Crie um objetivo, como &quot;Reserva de emergência&quot; ou &quot;Viagem&quot;, e acompanhe cada aporte.">
              <p-button label="Novo objetivo" icon="pi pi-plus" size="small" (onClick)="openGoal(null)" />
            </app-empty-state>
          </div>
        }
      </div>

      <section class="panel" style="margin-top: 1rem">
        <div class="panel-title">Movimentações</div>
        @for (m of d.movements; track m.id) {
          <div class="list-row">
            <div class="grow">
              <div style="font-weight: 600">{{ m.description || (m.amount > 0 ? 'Aporte' : 'Resgate') }}</div>
              <div class="faint" style="font-size: 0.72rem">{{ m.goalName }} · {{ m.movementDate | date: 'dd/MM/yyyy' }}</div>
            </div>
            <span class="amount" [class.text-green]="m.amount > 0" [class.text-red]="m.amount < 0">{{ m.amount > 0 ? '+' : '−' }} {{ abs(m.amount) | brl }}</span>
            <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="removeMovement(m)" ariaLabel="Excluir" />
          </div>
        } @empty {
          <app-empty-state illustration="empty" title="Nenhuma movimentação ainda" [compact]="true" />
        }
      </section>
    }

    <p-dialog [header]="editingGoal() ? 'Editar objetivo' : 'Novo objetivo'" [(visible)]="goalOpen" [modal]="true" [style]="{ width: '440px' }" [breakpoints]="{ '640px': '95vw' }" [draggable]="false">
      <form [formGroup]="goalForm" (ngSubmit)="saveGoal()" class="form-grid">
        <div class="full"><label for="g-name">Nome</label><input pInputText id="g-name" formControlName="name" class="w-full" maxlength="80" /></div>
        <div class="full"><label for="g-target">Meta</label>
          <p-inputnumber inputId="g-target" formControlName="targetAmount" mode="currency" currency="BRL" locale="pt-BR" class="w-full" [min]="0" /></div>
        <div class="full"><label>Cor</label>
          <div class="colors">
            @for (c of colors; track c) {
              <button type="button" class="color" [style.background]="c" [class.on]="goalForm.controls.color.value === c" (click)="goalForm.controls.color.setValue(c)" [attr.aria-label]="'Cor ' + c"></button>
            }
          </div>
        </div>
        <div class="full dialog-actions">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="goalOpen.set(false)" />
          <p-button type="submit" label="Salvar" icon="pi pi-check" [disabled]="goalForm.invalid" />
        </div>
      </form>
    </p-dialog>

    <p-dialog [header]="(movementForm.controls.type.value === 'APORTE' ? 'Guardar em ' : 'Resgatar de ') + (movementGoal()?.name ?? '')" [(visible)]="movementOpen"
      [modal]="true" [style]="{ width: '440px' }" [breakpoints]="{ '640px': '95vw' }" [draggable]="false">
      <form [formGroup]="movementForm" (ngSubmit)="saveMovement()" class="form-grid">
        <div class="full"><p-selectbutton formControlName="type" [options]="movementTypes" optionLabel="label" optionValue="value" [allowEmpty]="false" /></div>
        <div><label for="m-amount">Valor</label>
          <p-inputnumber inputId="m-amount" formControlName="amount" mode="currency" currency="BRL" locale="pt-BR" class="w-full" [min]="0" /></div>
        <div><label for="m-date">Data</label><p-datepicker inputId="m-date" formControlName="movementDate" dateFormat="dd/mm/yy" class="w-full" [readonlyInput]="true" /></div>
        <div class="full"><label for="m-desc">Descrição (opcional)</label><input pInputText id="m-desc" formControlName="description" class="w-full" maxlength="120" /></div>
        <div class="full dialog-actions">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="movementOpen.set(false)" />
          <p-button type="submit" label="Confirmar" icon="pi pi-check" [disabled]="movementForm.invalid" />
        </div>
      </form>
    </p-dialog>
  `,
  styles: `
    .goals { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .g-dot { width: 12px; height: 12px; border-radius: 4px; }
    .bar { height: 8px; background: var(--app-surface-2); border-radius: 9px; margin-top: 0.75rem; overflow: hidden; }
    .bar span { display: block; height: 100%; border-radius: 9px; transition: width 0.4s; }
    .colors { display: flex; gap: 0.5rem; }
    .color { width: 28px; height: 28px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; outline: 2px solid transparent; }
    .color.on { outline-color: var(--app-primary); border-color: var(--app-surface); }
  `,
})
export class ReservePage {
  private readonly api = inject(ApiService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  protected readonly state = inject(AppState);
  protected readonly colors = GOAL_COLORS;
  protected readonly abs = Math.abs;

  protected readonly data = rxResource({
    params: () => ({ v: this.state.version() }),
    stream: () => this.api.reserve(),
  });

  protected readonly goalOpen = signal(false);
  protected readonly editingGoal = signal<Goal | null>(null);
  protected readonly movementOpen = signal(false);
  protected readonly movementGoal = signal<Goal | null>(null);
  protected readonly movementTypes = [
    { label: 'Guardar', value: 'APORTE' as const },
    { label: 'Resgatar', value: 'RESGATE' as const },
  ];

  protected readonly goalForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    targetAmount: [0, [Validators.required, Validators.min(0.01)]],
    color: [GOAL_COLORS[0], Validators.required],
  });

  protected readonly movementForm = this.fb.group({
    type: this.fb.nonNullable.control<'APORTE' | 'RESGATE'>('APORTE'),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    movementDate: this.fb.nonNullable.control(new Date(), Validators.required),
    description: this.fb.nonNullable.control('', Validators.maxLength(120)),
  });

  protected openGoal(g: Goal | null): void {
    this.editingGoal.set(g);
    this.goalForm.reset(g ? { name: g.name, targetAmount: g.targetAmount, color: g.color } : { name: '', targetAmount: 0, color: GOAL_COLORS[0] });
    this.goalOpen.set(true);
  }

  protected saveGoal(): void {
    const g = this.editingGoal();
    const body = { ...this.goalForm.getRawValue() };
    body.name = body.name.trim();
    (g ? this.api.updateGoal(g.id, body) : this.api.createGoal(body)).subscribe((o) => this.done(o, 'Objetivo salvo'));
    this.goalOpen.set(false);
  }

  protected openMovement(g: Goal, type: 'APORTE' | 'RESGATE'): void {
    this.movementGoal.set(g);
    this.movementForm.reset({ type, amount: null, movementDate: new Date(), description: '' });
    this.movementOpen.set(true);
  }

  protected saveMovement(): void {
    const g = this.movementGoal();
    if (!g || this.movementForm.invalid) return;
    const v = this.movementForm.getRawValue();
    this.api
      .addMovement(g.id, { type: v.type, amount: v.amount!, movementDate: toIsoDate(v.movementDate), description: v.description.trim() || null })
      .subscribe((o) => {
        this.movementOpen.set(false);
        this.done(o, v.type === 'APORTE' ? 'Valor guardado' : 'Resgate registrado');
      });
  }

  protected removeGoal(g: Goal): void {
    this.confirm.confirm({
      header: 'Excluir objetivo',
      message: `Excluir "${g.name}" e todas as suas movimentações?`,
      icon: 'pi pi-trash',
      acceptButtonProps: { label: 'Excluir', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', text: true },
      accept: () => this.api.deleteGoal(g.id).subscribe((o) => this.done(o)),
    });
  }

  protected removeMovement(m: Movement): void {
    this.confirm.confirm({
      header: 'Excluir movimentação',
      message: 'Excluir esta movimentação?',
      icon: 'pi pi-trash',
      acceptButtonProps: { label: 'Excluir', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', text: true },
      accept: () => this.api.deleteMovement(m.goalId, m.id).subscribe((o) => this.done(o)),
    });
  }

  private done(overview: ReserveOverview, message?: string): void {
    this.data.set(overview);
    if (message) this.messages.add({ severity: 'success', summary: message });
    this.state.dataChanged();
  }
}
