import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSession } from '../services/core/auth-session';

export const authGuard: CanActivateFn = () => inject(AuthSession).isAuthenticated()
  ? true
  : inject(Router).createUrlTree(['/login']);
