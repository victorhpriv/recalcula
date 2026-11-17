import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

import { ProblemDetail } from '../api/models';

/** Use `context: new HttpContext().set(SILENT_ERRORS, true)` para tratar o erro manualmente. */
export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);

/** Exibe um toast amigável para erros da API (exceto 401, tratado pelo authInterceptor). */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messages = inject(MessageService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status !== 401 && !req.context.get(SILENT_ERRORS)) {
        const problem = (err.error ?? {}) as ProblemDetail;
        const detail =
          err.status === 0
            ? 'Não foi possível conectar ao servidor.'
            : (problem.errors && Object.values(problem.errors)[0]) || problem.detail || 'Erro inesperado.';
        messages.add({ severity: 'error', summary: problem.title ?? 'Ops!', detail, life: 5000 });
      }
      return throwError(() => err);
    }),
  );
};

export function problemMessage(err: unknown, fallback = 'Erro inesperado.'): string {
  if (err instanceof HttpErrorResponse) {
    const p = (err.error ?? {}) as ProblemDetail;
    return (p.errors && Object.values(p.errors)[0]) || p.detail || fallback;
  }
  return fallback;
}
