import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';

import { AuthService } from '../../core/auth/auth.service';
import { problemMessage } from '../../core/http/error.interceptor';
import { AuthHero } from './auth-hero';

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, MessageModule, CheckboxModule, AuthHero],
  styleUrl: './auth.scss',
  template: `
    <app-auth-hero class="hero" />
    <div class="form-side">
      <form class="box" [formGroup]="form" (ngSubmit)="submit()">
        <h2>Criar conta</h2>
        <p class="sub">Comece a organizar o seu dinheiro.</p>

        @if (error()) {
          <p-message severity="error">{{ error() }}</p-message>
        }

        <div class="field" style="margin-top: 1rem">
          <label for="name">Seu nome</label>
          <input pInputText id="name" formControlName="name" autocomplete="given-name" class="w-full" maxlength="80" />
        </div>
        <div class="field">
          <label for="email">E-mail</label>
          <input pInputText id="email" type="email" formControlName="email" autocomplete="email" class="w-full" />
        </div>
        <div class="field">
          <label for="password">Senha</label>
          <p-password inputId="password" formControlName="password" [toggleMask]="true" autocomplete="new-password"
            class="w-full" inputStyleClass="w-full" promptLabel="Mínimo 8 caracteres, com letras e números" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <div class="error">Mínimo de 8 caracteres, com letras e números.</div>
          }
        </div>

        <div class="field terms">
          <p-checkbox inputId="terms" formControlName="acceptTerms" [binary]="true" />
          <label for="terms">Li e aceito os <a href="/termos.html" target="_blank" rel="noopener">Termos de Uso</a> e a <a href="/privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.</label>
        </div>

        <p-button type="submit" label="Criar conta" styleClass="w-full" [loading]="loading()" [disabled]="form.invalid" />

        <div class="alt">Já tem conta? <a routerLink="/login">Entrar</a></div>
      </form>
    </div>
  `,
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    acceptTerms: [false, Validators.requiredTrue],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.auth
      .register({ name: v.name.trim(), email: v.email.trim(), password: v.password, acceptTerms: v.acceptTerms })
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (err) => {
          this.loading.set(false);
          this.error.set(problemMessage(err, 'Não foi possível criar a conta.'));
        },
      });
  }
}
