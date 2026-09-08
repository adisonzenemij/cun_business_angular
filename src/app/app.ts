import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionTimer } from './services/core/session-timer';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('d36851fed952');
  private readonly sessionTimer = inject(SessionTimer);

  constructor() {
    this.sessionTimer.start();
  }
}
