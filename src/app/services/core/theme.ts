import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type ThemeMode = 'auto' | 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'themeMode';
  readonly mode = signal<ThemeMode>('auto');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    const stored = this.storage()?.getItem(this.storageKey);
    if (stored === 'auto' || stored === 'dark' || stored === 'light') this.mode.set(stored);
    this.apply();
    this.document.defaultView?.addEventListener('storage', (event) => {
      if (
        event.key === this.storageKey &&
        (event.newValue === 'auto' || event.newValue === 'dark' || event.newValue === 'light')
      ) {
        this.mode.set(event.newValue);
        this.apply();
      }
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    if (isPlatformBrowser(this.platformId)) {
      this.storage()?.setItem(this.storageKey, mode);
      this.apply();
    }
  }

  private apply(): void {
    const prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.document.documentElement.setAttribute(
      'data-bs-theme',
      this.mode() === 'auto' ? (prefersDark ? 'dark' : 'light') : this.mode(),
    );
  }
  private storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
