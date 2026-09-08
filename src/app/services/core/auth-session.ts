import { Injectable, signal } from '@angular/core';

interface JwtPayload {
  exp?: number;
  sub?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthSession {
  private readonly key = 'cun.business.jwt';
  readonly changed = signal(0);

  save(token: string): void {
    localStorage.setItem(this.key, token);
    this.changed.update((value) => value + 1);
  }

  token(): string | null {
    this.changed();
    return localStorage.getItem(this.key);
  }
  isAuthenticated(): boolean {
    const token = this.token();
    const expiration = this.expirationTime();
    return !!token && (expiration === null || expiration > Date.now());
  }
  expirationTime(): number | null {
    const payload = this.payload();
    return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
  }
  userName(): string | null {
    return this.payload()?.sub ?? null;
  }
  clear(): void {
    localStorage.removeItem(this.key);
    this.changed.update((value) => value + 1);
  }
  private payload(): JwtPayload | null {
    try {
      const encoded = this.token()?.split('.')[1];
      if (!encoded) return null;
      const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      return JSON.parse(atob(padded)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
