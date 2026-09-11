import { inject } from '@angular/core';
import { CanActivateChildFn, Router, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs';
import { FastApi, FAST_API_URL } from '../services/backend/python/fast/fast-api';

const routeClients: Record<string, string> = {
  d8d07776: 'd8d07776', e144c860: 'e144c860', a7b95fe8: 'a7b95fe8', a1fecd50: 'a1fecd50', e9cb64fd: 'e9cb64fd', b602ef28: 'b602ef28', d02ee146: 'd02ee146', a8dc1924: 'a8dc1924', b64883b6: 'b64883b6', d35a393b: 'd35a393b', '8ebaa791': '8ebaa791', a1cc27fb: 'a1cc27fb', e5520e1e: 'e5520e1e', a6aedeb5: 'a6aedeb5', a3b378b4: 'a3b378b4', d5fb87de: 'd5fb87de', d2e6ded6: 'd2e6ded6', d76a0e67: 'd76a0e67', a5acf579: 'a5acf579',
};

export const resourcePermissionGuard: CanActivateChildFn = (_route, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const segment = state.url.split('?')[0].split('/').pop() ?? '';
  const client = routeClients[segment];
  if (!client) return true;
  return inject(FastApi).http.get<{ permissions: { client: string; access: string }[] }>(`${FAST_API_URL}/auth/permissions`).pipe(
    map((result) => result.permissions.some((permission) => permission.client === client && permission.access === 'Permitido') || router.createUrlTree(['/working/dashboard'])),
  );
};
