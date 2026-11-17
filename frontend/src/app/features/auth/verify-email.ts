import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../core/auth/auth.service';
import { problemMessage } from '../../core/http/error.interceptor';
import { AuthHero } from './auth-hero';

@Component({
  selector: 'app-verify-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonModule, AuthHero],
  styleUrl: './auth.scss',
  template: `
    <app-auth-hero class="hero" />
    <div class="form-side">
      <div class="box">
        @switch (status()) {
          @case ('loading') { <h2>Confirmando seu e-mail…</h2> }
          @case ('ok') {
            <img src="illustrations/receipt.svg" width="72" height="72" alt="" />
            <h2>E-mail confirmado!</h2>
            <p class="sub">Tudo certo. Sua conta está protegida.</p>
            <p-button [label]="auth.isAuthenticated() ? 'Ir para o app' : 'Entrar'" styleClass="w-full" [routerLink]="auth.isAuthenticated() ? '/' : '/login'" />
          }
          @case ('error') {
            <img src="illustrations/empty.svg" width="72" height="72" alt="" />
            <h2>Não foi possível confirmar</h2>
            <p class="sub">{{ error() }}</p>
            <p class="sub">Entre no app e peça um novo link no aviso do topo da tela.</p>
            <p-button label="Ir para o app" styleClass="w-full" routerLink="/" />
          }
        }
      </div>
    </div>
  `,
})
export class VerifyEmail implements OnInit {
  protected readonly auth = inject(AuthService);
  readonly token = input<string>();

  protected readonly status = signal<'loading' | 'ok' | 'error'>('loading');
  protected readonly error = signal('');

  ngOnInit(): void {
    const token = this.token();
    if (!token) {
      this.error.set('Link incompleto.');
      this.status.set('error');
      return;
    }
    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.status.set('ok');
        if (this.auth.isAuthenticated()) this.auth.reloadMe();
      },
      error: (err) => {
        this.error.set(problemMessage(err, 'Link inválido ou expirado.'));
        this.status.set('error');
      },
    });
  }
}
