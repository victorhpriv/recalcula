import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { AuthService } from './core/auth/auth.service';
import { AppPreset } from './core/theme/preset';
import { PT_BR_TRANSLATION } from './core/theme/pt-br';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    providePrimeNG({
      theme: { preset: AppPreset, options: { darkModeSelector: '.app-dark', cssLayer: false } },
      translation: PT_BR_TRANSLATION,
      ripple: false,
    }),
    // PWA: instala como app e funciona com a interface em cache. Dados da API nunca são cacheados.
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' }),
    MessageService,
    ConfirmationService,
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    // Tenta restaurar a sessão a partir do cookie de refresh (HttpOnly) antes de iniciar.
    provideAppInitializer(() => firstValueFrom(inject(AuthService).restoreSession())),
  ],
};
