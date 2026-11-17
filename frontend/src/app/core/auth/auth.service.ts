import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';

import { AuthResponse, LoginRequest, Me, RegisterRequest } from '../api/models';

/**
 * Sessão do usuário.
 * - Access token só em memória (nunca em localStorage → protege contra roubo via XSS).
 * - Refresh token fica em cookie HttpOnly, gerenciado pelo navegador.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly token = signal<string | null>(null);
  readonly user = signal<Me | null>(null);
  readonly isAuthenticated = computed(() => this.token() !== null);

  private refreshInFlight$: Observable<string | null> | null = null;

  get accessToken(): string | null {
    return this.token();
  }

  login(body: LoginRequest): Observable<Me> {
    return this.http.post<AuthResponse>('/api/auth/login', body, { withCredentials: true }).pipe(
      tap((res) => this.setSession(res)),
      map((res) => res.user),
    );
  }

  register(body: RegisterRequest): Observable<Me> {
    return this.http.post<AuthResponse>('/api/auth/register', body, { withCredentials: true }).pipe(
      tap((res) => this.setSession(res)),
      map((res) => res.user),
    );
  }

  /** Renova o access token. Chamadas concorrentes compartilham a mesma requisição. */
  refresh(): Observable<string | null> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http
        .post<AuthResponse>('/api/auth/refresh', null, { withCredentials: true })
        .pipe(
          tap((res) => this.setSession(res)),
          map((res) => res.accessToken),
          catchError(() => {
            this.clear();
            return of(null);
          }),
          finalize(() => (this.refreshInFlight$ = null)),
          shareReplay(1),
        );
    }
    return this.refreshInFlight$;
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>('/api/auth/forgot-password', { email });
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http.post<void>('/api/auth/reset-password', { token, password });
  }

  verifyEmail(token: string): Observable<void> {
    return this.http.post<void>('/api/auth/verify-email', { token });
  }

  /** Troca a senha; o backend encerra outras sessões e devolve uma nova para este dispositivo. */
  changePassword(currentPassword: string, newPassword: string): Observable<Me> {
    return this.http
      .put<AuthResponse>('/api/account/password', { currentPassword, newPassword }, { withCredentials: true })
      .pipe(tap((res) => this.setSession(res)), map((res) => res.user));
  }

  /** Após excluir a conta. */
  clearAndGoHome(): void {
    this.clear();
    this.router.navigate(['/login'], { queryParams: { deleted: 1 } });
  }

  restoreSession(): Observable<boolean> {
    return this.refresh().pipe(map((t) => t !== null));
  }

  reloadMe(): void {
    this.http.get<Me>('/api/auth/me').subscribe((me) => this.user.set(me));
  }

  logout(): void {
    this.http
      .post('/api/auth/logout', null, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.clear();
        this.router.navigateByUrl('/login');
      });
  }

  /** Sessão expirada (refresh falhou). */
  sessionExpired(): void {
    this.clear();
    this.router.navigate(['/login'], { queryParams: { expired: 1 } });
  }

  private setSession(res: AuthResponse): void {
    this.token.set(res.accessToken);
    this.user.set(res.user);
  }

  private clear(): void {
    this.token.set(null);
    this.user.set(null);
  }
}
