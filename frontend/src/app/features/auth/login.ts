import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';

import { AuthService } from '../../core/auth/auth.service';
import { problemMessage } from '../../core/http/error.interceptor';
import { AuthHero } from './auth-hero';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, MessageModule, AuthHero],
  styleUrl: './auth.scss',
  template: `
    <app-auth-hero class="hero" />
    <div class="form-side">
      <form class="box" [formGroup]="form" (ngSubmit)="submit()">
        <h2>Bem-vindo de volta</h2>
        <p class="sub">Entre para ver suas finanças.</p>

        @if (deleted()) {
          <p-message severity="success">Sua conta e todos os seus dados foram excluídos.</p-message>
        }
        @if (expired()) {
          <p-message severity="info">Sua sessão expirou. Entre novamente.</p-message>
        }
        @if (error()) {
          <p-message severity="error">{{ error() }}</p-message>
        }

        <div class="field" style="margin-top: 1rem">
          <label for="email">E-mail</label>
          <input pInputText id="email" type="email" formControlName="email" autocomplete="email" class="w-full" />
        </div>
        <div class="field">
          <label for="password">Senha</label>
          <p-password inputId="password" formControlName="password" [feedback]="false" [toggleMask]="true"
            autocomplete="current-password" class="w-full" inputStyleClass="w-full" />
          <div class="forgot"><a routerLink="/esqueci-senha">Esqueci minha senha</a></div>
        </div>

        <p-button type="submit" label="Entrar" styleClass="w-full" [loading]="loading()" [disabled]="form.invalid" />

        <div class="alt">Ainda não tem conta? <a routerLink="/cadastro">Criar conta</a></div>
      </form>
    </div>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  /** Query param ?expired=1 (via withComponentInputBinding). */
  readonly expired = input<string | undefined>();
  readonly deleted = input<string | undefined>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => {
        this.loading.set(false);
        this.error.set(problemMessage(err, 'Não foi possível entrar.'));
      },
    });
  }
}
