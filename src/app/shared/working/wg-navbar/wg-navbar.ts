import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthSession } from '../../../services/core/auth-session';
import { SidebarState } from '../../../services/core/sidebar-state';

@Component({
  imports: [RouterLink],
  selector: 'app-wg-navbar',
  styleUrl: './wg-navbar.css',
  templateUrl: './wg-navbar.html',
})
export class WgNavbar {
  readonly sidebar = inject(SidebarState);
  readonly session = inject(AuthSession);
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
