import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';

import { AuthService } from '../../core/auth/auth.service';
import { problemMessage } from '../../core/http/error.interceptor';
import { AuthHero } from './auth-hero';

@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, PasswordModule, MessageModule, AuthHero],
  styleUrl: './auth.scss',
  template: `
    <app-auth-hero class="hero" />
    <div class="form-side">
      <form class="box" [formGroup]="form" (ngSubmit)="submit()">
        <h2>Criar nova senha</h2>
        <p class="sub">Por segurança, você vai sair de todos os outros dispositivos.</p>
        @if (!token()) {
          <p-message severity="error">Link incompleto. Peça um novo em "Esqueci minha senha".</p-message>
        }
        @if (error()) { <p-message severity="error">{{ error() }}</p-message> }
        <div class="field" style="margin-top: 1rem">
          <label for="password">Nova senha</label>
          <p-password inputId="password" formControlName="password" [toggleMask]="true" autocomplete="new-password"
            class="w-full" inputStyleClass="w-full" promptLabel="Mínimo 8 caracteres, com letras e números" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <div class="error">Mínimo de 8 caracteres, com letras e números.</div>
          }
        </div>
        <p-button type="submit" label="Salvar nova senha" styleClass="w-full" [loading]="loading()" [disabled]="form.invalid || !token()" />
        <div class="alt"><a routerLink="/esqueci-senha">Pedir outro link</a></div>
      </form>
    </div>
  `,
})
export class ResetPassword {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  /** ?token=... */
  readonly token = input<string>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]],
  });

  protected submit(): void {
    const token = this.token();
    if (this.form.invalid || !token) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.resetPassword(token, this.form.getRawValue().password).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Senha alterada', detail: 'Entre com a nova senha.' });
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(problemMessage(err, 'Não foi possível alterar a senha.'));
      },
    });
  }
}
