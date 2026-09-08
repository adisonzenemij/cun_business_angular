import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthSession {
  private readonly key = 'cun.business.jwt';
  readonly changed = signal(0);

  save(token: string): void {
    localStorage.setItem(this.key, token);
    this.changed.update((value) => value + 1);
  }

  token(): string | null { return localStorage.getItem(this.key); }
  isAuthenticated(): boolean { return !!this.token(); }
  clear(): void { localStorage.removeItem(this.key); this.changed.update((value) => value + 1); }
}
