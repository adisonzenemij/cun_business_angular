import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthSession } from '../../../services/core/auth-session';
import { SidebarState } from '../../../services/core/sidebar-state';
import { SessionTimer } from '../../../services/core/session-timer';
import { ThemeToggle } from '../../theme-toggle/theme-toggle';
import { FastApi, FAST_API_URL } from '../../../services/backend/python/fast/fast-api';

interface RolePermission { module: string; resource: string; access: string; }
interface PermissionModule { name: string; permissions: RolePermission[]; }
interface ModulePermission { module: string; access: string; }

@Component({
  imports: [RouterLink, RouterLinkActive, ThemeToggle],
  selector: 'app-wg-navbar',
  styleUrl: './wg-navbar.css',
  templateUrl: './wg-navbar.html',
})
export class WgNavbar {
  readonly sidebar = inject(SidebarState);
  readonly session = inject(AuthSession);
  readonly sessionTimer = inject(SessionTimer);
  readonly api = inject(FastApi);
  readonly showPermissions = signal(false);
  readonly roleName = signal<string | null>(null);
  readonly permissions = signal<RolePermission[]>([]);
  readonly permissionModules = signal<PermissionModule[]>([]);
  readonly modulePermissions = signal<ModulePermission[]>([]);
  readonly permissionTab = signal<'modules' | 'resources'>('modules');
  private readonly router = inject(Router);
  openPermissions(): void {
    this.api.http.get<{ role: string | null; permissions: RolePermission[]; module_permissions: ModulePermission[] }>(`${FAST_API_URL}/auth/permissions`).subscribe({
      next: (result) => {
        this.roleName.set(result.role);
        this.permissions.set(result.permissions);
        this.modulePermissions.set(result.module_permissions);
        this.permissionTab.set('modules');
        const grouped = new Map<string, RolePermission[]>();
        for (const permission of result.permissions) grouped.set(permission.module, [...(grouped.get(permission.module) ?? []), permission]);
        this.permissionModules.set([...grouped.entries()].map(([name, permissions]) => ({ name, permissions })));
        this.showPermissions.set(true);
      },
    });
  }
  async logout(): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Desea cerrar sesión?',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      this.session.clear();
      void this.router.navigate(['/portal/home']);
    }
  }
}
