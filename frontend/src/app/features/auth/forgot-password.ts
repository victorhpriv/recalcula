import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { AuthService } from '../../core/auth/auth.service';
import { AuthHero } from './auth-hero';

@Component({
  selector: 'app-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, AuthHero],
  styleUrl: './auth.scss',
  template: `
    <app-auth-hero class="hero" />
    <div class="form-side">
      @if (sent()) {
        <div class="box">
          <img src="illustrations/calendar.svg" width="72" height="72" alt="" />
          <h2>Confira seu e-mail</h2>
          <p class="sub">Se existir uma conta com <b>{{ form.controls.email.value }}</b>, enviamos um link para criar uma nova senha. Ele vale por 1 hora.</p>
          <p class="sub">Não chegou? Veja a caixa de spam ou tente de novo em alguns minutos.</p>
          <div class="alt"><a routerLink="/login">Voltar para o login</a></div>
        </div>
      } @else {
        <form class="box" [formGroup]="form" (ngSubmit)="submit()">
          <h2>Esqueceu a senha?</h2>
          <p class="sub">Informe seu e-mail e enviaremos um link para criar uma nova.</p>
          <div class="field">
            <label for="email">E-mail</label>
            <input pInputText id="email" type="email" formControlName="email" autocomplete="email" class="w-full" />
          </div>
          <p-button type="submit" label="Enviar link" styleClass="w-full" [loading]="loading()" [disabled]="form.invalid" />
          <div class="alt"><a routerLink="/login">Voltar para o login</a></div>
        </form>
      }
    </div>
  `,
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly sent = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.forgotPassword(this.form.getRawValue().email.trim()).subscribe({
      next: () => this.sent.set(true),
      error: () => this.loading.set(false),
    });
  }
}
