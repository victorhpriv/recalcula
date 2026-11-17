import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from './auth.service';

const PUBLIC_AUTH = [
  '/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout',
  '/api/auth/forgot-password', '/api/auth/reset-password', '/api/auth/verify-email',
];

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

/**
 * Anexa o access token às chamadas da API e, ao receber 401,
 * tenta renovar a sessão uma única vez antes de repetir a requisição.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApi = req.url.startsWith('/api/');
  const isPublicAuth = PUBLIC_AUTH.some((p) => req.url.startsWith(p));

  if (!isApi || isPublicAuth) {
    return next(req);
  }

  return next(withToken(req, auth.accessToken)).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }
      return auth.refresh().pipe(
        switchMap((token) => {
          if (!token) {
            auth.sessionExpired();
            return throwError(() => err);
          }
          return next(withToken(req, token));
        }),
      );
    }),
  );
};
