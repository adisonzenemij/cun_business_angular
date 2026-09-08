import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthSession } from '../../../services/core/auth-session';
import { SessionTimer } from '../../../services/core/session-timer';
import { ThemeToggle } from '../../theme-toggle/theme-toggle';

@Component({
  imports: [RouterLink, ThemeToggle],
  selector: 'app-pt-navbar',
  styleUrl: './pt-navbar.css',
  templateUrl: './pt-navbar.html',
})
export class PtNavbar {
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
