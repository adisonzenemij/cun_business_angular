import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarState {
  readonly visible = signal(true);
  toggle(): void { this.visible.update((value) => !value); }
}
