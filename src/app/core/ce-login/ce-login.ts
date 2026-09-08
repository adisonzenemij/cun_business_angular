import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { FastAuth } from '../../services/backend/python/fast/fast-auth';
import { AuthSession } from '../../services/core/auth-session';
import { PtNavbar } from '../../shared/portal/pt-navbar/pt-navbar';
import { PtFooter } from '../../shared/portal/pt-footer/pt-footer';

@Component({
  imports: [ReactiveFormsModule, PtNavbar, PtFooter],
  selector: 'app-ce-login',
  styleUrl: './ce-login.css',
  templateUrl: './ce-login.html',
})
export class CeLogin {
  private readonly builder = inject(FormBuilder);
  private readonly auth = inject(FastAuth);
  private readonly session = inject(AuthSession);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.builder.nonNullable.group({
    fd_login: ['', Validators.required],
    fd_passd: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.loading.set(true);
    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ access_token }) => {
          this.session.save(access_token);
          void this.router.navigate(['/working/dashboard']);
        },
        error: () =>
          this.error.set('No fue posible iniciar sesión. Verifica tus credenciales y el backend.'),
      });
  }
}
