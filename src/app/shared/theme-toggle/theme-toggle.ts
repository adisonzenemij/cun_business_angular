import { Component, inject, signal } from '@angular/core';
import { Theme, ThemeMode } from '../../services/core/theme';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.css',
})
export class ThemeToggle {
  readonly theme = inject(Theme);
  readonly open = signal(false);
  setTheme(mode: ThemeMode): void {
    this.theme.setMode(mode);
    this.open.set(false);
  }
  icon(): string {
    return this.theme.mode() === 'light'
      ? 'bi-sun-fill'
      : this.theme.mode() === 'dark'
        ? 'bi-moon-stars-fill'
        : 'bi-circle-half';
  }
}
