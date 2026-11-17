import { Injectable, effect, signal } from '@angular/core';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'fad-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initial());

  constructor() {
    effect(() => {
      const dark = this.theme() === 'dark';
      document.documentElement.classList.toggle('app-dark', dark);
      try {
        localStorage.setItem(STORAGE_KEY, this.theme());
      } catch {
        /* armazenamento indisponível: segue sem persistir */
      }
    });
  }

  set(theme: Theme): void {
    this.theme.set(theme);
  }

  private initial(): Theme {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* ignora */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
