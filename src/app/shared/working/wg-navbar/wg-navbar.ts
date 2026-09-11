import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthSession } from '../../../services/core/auth-session';
import { SidebarState } from '../../../services/core/sidebar-state';
import { SessionTimer } from '../../../services/core/session-timer';
import { ThemeToggle } from '../../theme-toggle/theme-toggle';

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
  private readonly router = inject(Router);
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
