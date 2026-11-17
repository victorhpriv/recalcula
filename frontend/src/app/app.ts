import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastModule],
  template: `
    @if (!auth.isAuthenticated()) { <p-toast position="top-right" /> }
    <router-outlet />
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
  // Instancia o serviço de tema logo no início para aplicar a classe do modo escuro.
  private readonly theme = inject(ThemeService);
}
