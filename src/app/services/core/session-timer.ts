import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthSession } from './auth-session';

@Injectable({ providedIn: 'root' })
export class SessionTimer {
  private readonly session = inject(AuthSession);
  private readonly router = inject(Router);
  private intervalId?: ReturnType<typeof setInterval>;
  private trackedExpiration?: number;
  private warningShownFor?: number;
  readonly remainingTime = signal('');

  start(): void {
    const expiration = this.session.expirationTime();
    if (!expiration || !this.session.isAuthenticated()) {
      this.stop();
      return;
    }
    if (this.trackedExpiration === expiration && this.intervalId) return;
    this.stop();
    this.trackedExpiration = expiration;
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1_000);
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = undefined;
    this.trackedExpiration = undefined;
    this.remainingTime.set('');
  }

  logout(): void {
    this.stop();
    this.session.clear();
    Swal.close();
    void this.router.navigate(['/portal/home']);
  }

  private tick(): void {
    const expiration = this.session.expirationTime();
    if (!expiration) {
      this.logout();
      return;
    }
    const remaining = expiration - Date.now();
    if (remaining <= 0) {
      this.logout();
      return;
    }
    this.remainingTime.set(this.formatTime(remaining));
    if (remaining <= 15 * 60_000 && this.warningShownFor !== expiration) {
      this.warningShownFor = expiration;
      void Swal.fire({
        icon: 'warning',
        title: 'Sesión próxima a expirar',
        text: 'Tu sesión finalizará en aproximadamente 15 minutos.',
        confirmButtonText: 'Aceptar',
      });
    }
  }

  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
    const hours = Math.floor(totalSeconds / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  }
}
