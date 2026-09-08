import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthSession } from './auth-session';
import { SessionTimer } from './session-timer';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(AuthSession);
  const sessionTimer = inject(SessionTimer);
  const token = session.token();
  return next(
    token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request,
  ).pipe(
    catchError((error) => {
      if (error.status === 401 && !request.url.includes('/auth/login')) sessionTimer.logout();
      return throwError(() => error);
    }),
  );
};
