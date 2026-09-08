import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSession } from '../services/core/auth-session';

/** Impide volver al inicio de sesión cuando ya existe una sesión válida. */
export const loginGuard: CanActivateFn = () =>
  inject(AuthSession).isAuthenticated()
    ? inject(Router).createUrlTree(['/working/dashboard'])
    : true;
