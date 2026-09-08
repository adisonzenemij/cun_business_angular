import { DOCUMENT } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

type Theme = 'auto' | 'light' | 'dark';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.css',
})
export class ThemeToggle implements OnInit {
  private readonly document = inject(DOCUMENT);
  readonly open = signal(false);
  readonly theme = signal<Theme>('auto');
  ngOnInit(): void {
    const saved = localStorage.getItem('cun.business.theme') as Theme | null;
    this.setTheme(saved === 'light' || saved === 'dark' || saved === 'auto' ? saved : 'auto');
  }
  setTheme(theme: Theme): void {
    this.theme.set(theme);
    localStorage.setItem('cun.business.theme', theme);
    const dark =
      theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    this.document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
    this.open.set(false);
  }
  icon(): string {
    return this.theme() === 'light'
      ? 'bi-sun-fill'
      : this.theme() === 'dark'
        ? 'bi-moon-stars-fill'
        : 'bi-circle-half';
  }
}
