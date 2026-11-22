import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';

import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { Avatar } from '../../shared/ui/avatar';
import { LucideAngularModule } from 'lucide-angular';
import { I } from '../../shared/ui/icons';

@Component({
  selector: 'app-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, DatePipe, FormsModule, ReactiveFormsModule, ButtonModule, DialogModule, InputTextModule, PasswordModule, TagModule, Avatar],
  template: `
    <div class="page-header">
      <div class="page-hero">
        <app-avatar [name]="auth.user()?.name ?? ''" [size]="56" />
        <div>
          <h1>Minha conta</h1>
          <p>Seus dados, segurança e privacidade.</p>
        </div>
      </div>
    </div>

    <div class="cols rise">
      <div class="stack">
        <section class="panel">
          <div class="panel-title">Perfil</div>
          <div class="form-grid" style="grid-template-columns: 1fr; margin-top: 0.8rem">
            <div>
              <label for="a-name">Nome</label>
              <input pInputText id="a-name" [(ngModel)]="name" class="w-full" maxlength="80" />
            </div>
            <div>
              <label>E-mail</label>
              <div class="row">
                <span>{{ account.value()?.email }}</span>
                @if (account.value()?.emailVerified) {
                  <p-tag value="Confirmado" severity="success" icon="pi pi-check" />
                } @else {
                  <p-tag value="Não confirmado" severity="warn" />
                  <p-button label="Reenviar e-mail" size="small" [text]="true" (onClick)="resend()" />
                }
              </div>
            </div>
            @if (account.value(); as a) {
              <div class="faint" style="font-size: 0.75rem">Conta criada em {{ a.createdAt | date: 'dd/MM/yyyy' }}</div>
            }
            <div><p-button label="Salvar" icon="pi pi-check" (onClick)="saveProfile()" [disabled]="!name().trim()" /></div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-title">Alterar senha</div>
          <form [formGroup]="pwdForm" (ngSubmit)="changePassword()" class="form-grid" style="grid-template-columns: 1fr; margin-top: 0.8rem">
            <div>
              <label for="a-cur">Senha atual</label>
              <p-password inputId="a-cur" formControlName="currentPassword" [feedback]="false" [toggleMask]="true" autocomplete="current-password" class="w-full" inputStyleClass="w-full" />
            </div>
            <div>
              <label for="a-new">Nova senha</label>
              <p-password inputId="a-new" formControlName="newPassword" [toggleMask]="true" autocomplete="new-password" class="w-full" inputStyleClass="w-full" promptLabel="Mínimo 8 caracteres, com letras e números" />
              <div class="hint">Ao trocar, você sai dos outros dispositivos.</div>
            </div>
            <div><p-button type="submit" label="Alterar senha" icon="pi pi-lock" [loading]="savingPwd()" [disabled]="pwdForm.invalid" /></div>
          </form>
        </section>
      </div>

      <div class="stack">
        <section class="panel">
          <div class="panel-title"><lucide-icon [img]="I.Download" [size]="16" /> Exportar meus dados</div>
          <p class="muted txt">Baixe um arquivo JSON com tudo o que você cadastrou no Recalcula: rendas, contas, cartões, compras, lançamentos e reserva.</p>
          <p-button label="Baixar meus dados" icon="pi pi-download" severity="secondary" [outlined]="true" [loading]="exporting()" (onClick)="exportData()" />
        </section>

        <section class="panel danger">
          <div class="panel-title"><lucide-icon [img]="I.TriangleAlert" [size]="16" /> Excluir conta</div>
          <p class="muted txt">Apaga definitivamente sua conta e <b>todos</b> os seus dados. Essa ação não pode ser desfeita. Se quiser, exporte seus dados antes.</p>
          <p-button label="Excluir minha conta" icon="pi pi-trash" severity="danger" [outlined]="true" (onClick)="deleteOpen.set(true)" />
        </section>

        <section class="panel">
          <div class="panel-title"><lucide-icon [img]="I.FileText" [size]="16" /> Documentos</div>
          <div class="links">
            <a href="/termos.html" target="_blank" rel="noopener">Termos de Uso <lucide-icon [img]="I.ArrowUpRight" [size]="14" /></a>
            <a href="/privacidade.html" target="_blank" rel="noopener">Política de Privacidade <lucide-icon [img]="I.ArrowUpRight" [size]="14" /></a>
          </div>
        </section>
      </div>
    </div>

    <p-dialog header="Excluir conta" [(visible)]="deleteOpen" [modal]="true" [style]="{ width: '420px' }" [breakpoints]="{ '640px': '95vw' }" [draggable]="false">
      <p class="muted" style="margin-top: 0">Para confirmar, digite sua senha. Todos os seus dados serão apagados para sempre.</p>
      <p-password [(ngModel)]="deletePassword" [feedback]="false" [toggleMask]="true" placeholder="Sua senha" class="w-full" inputStyleClass="w-full" />
      <div class="dialog-actions">
        <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="deleteOpen.set(false)" />
        <p-button label="Excluir definitivamente" severity="danger" icon="pi pi-trash" [loading]="deleting()" [disabled]="!deletePassword()" (onClick)="deleteAccount()" />
      </div>
    </p-dialog>
  `,
  styles: `
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
    .txt { font-size: 0.82rem; line-height: 1.5; margin: 0.5rem 0 1rem; }
    .danger { border-color: color-mix(in srgb, var(--app-red) 35%, var(--app-border)); }
    .danger .panel-title { color: var(--app-red); }
    .links { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.75rem; font-size: 0.85rem; }
    .links i { font-size: 0.7rem; margin-left: 0.25rem; }
    @media (max-width: 900px) { .cols { grid-template-columns: 1fr; } }
  `,
})
export class AccountPage {
  protected readonly I = I;
  private readonly api = inject(ApiService);
  private readonly messages = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);

  protected readonly account = rxResource({ stream: () => this.api.account() });
  protected readonly name = signal('');
  protected readonly savingPwd = signal(false);
  protected readonly exporting = signal(false);
  protected readonly deleteOpen = signal(false);
  protected readonly deletePassword = signal('');
  protected readonly deleting = signal(false);

  protected readonly pwdForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.maxLength(72)]],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]],
  });

  constructor() {
    effect(() => {
      const a = this.account.value();
      if (a) this.name.set(a.name);
    });
  }

  protected saveProfile(): void {
    this.api.updateProfile(this.name().trim()).subscribe((a) => {
      this.account.set(a);
      this.auth.reloadMe();
      this.messages.add({ severity: 'success', summary: 'Perfil atualizado' });
    });
  }

  protected resend(): void {
    this.api.resendVerification().subscribe(() =>
      this.messages.add({ severity: 'info', summary: 'E-mail enviado', detail: 'Confira sua caixa de entrada.' }),
    );
  }

  protected changePassword(): void {
    if (this.pwdForm.invalid) return;
    const v = this.pwdForm.getRawValue();
    this.savingPwd.set(true);
    this.auth.changePassword(v.currentPassword, v.newPassword).subscribe({
      next: () => {
        this.savingPwd.set(false);
        this.pwdForm.reset();
        this.messages.add({ severity: 'success', summary: 'Senha alterada', detail: 'As outras sessões foram encerradas.' });
      },
      error: () => this.savingPwd.set(false),
    });
  }

  protected exportData(): void {
    this.exporting.set(true);
    this.api.exportData().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saldo-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  protected deleteAccount(): void {
    this.deleting.set(true);
    this.api.deleteAccount(this.deletePassword()).subscribe({
      next: () => this.auth.clearAndGoHome(),
      error: () => this.deleting.set(false),
    });
  }
}
