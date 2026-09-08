import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthSession {
  private readonly key = 'cun.business.jwt';
  readonly changed = signal(0);

  save(token: string): void {
    localStorage.setItem(this.key, token);
    this.changed.update((value) => value + 1);
  }

  token(): string | null {
    return localStorage.getItem(this.key);
  }
  isAuthenticated(): boolean {
    return !!this.token();
  }
  userName(): string | null {
    try {
      const payload = this.token()?.split('.')[1];
      return payload
        ? ((JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: string })
            .sub ?? null)
        : null;
    } catch {
      return null;
    }
  }
  clear(): void {
    localStorage.removeItem(this.key);
    this.changed.update((value) => value + 1);
  }
}
