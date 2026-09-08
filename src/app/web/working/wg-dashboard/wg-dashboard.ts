import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FastApi } from '../../../services/backend/python/fast/fast-api';

interface DashboardModule { title: string; resource: string; path: string; icon: string; count: number | null; }

@Component({
  imports: [RouterLink],
  selector: 'app-wg-dashboard',
  styleUrl: './wg-dashboard.css',
  templateUrl: './wg-dashboard.html',
})
export class WgDashboard {
  private readonly api = inject(FastApi);
  readonly loading = signal(true);
  readonly modules = signal<DashboardModule[]>([
    { title: 'Orígenes CORS', resource: 'cors-origins', path: '/working/e144c860', icon: 'bi-globe', count: null },
    { title: 'Usuarios', resource: 'users', path: '/working/b64883b6', icon: 'bi-people', count: null },
    { title: 'Alcances', resource: 'scopes', path: '/working/a6aedeb5', icon: 'bi-shield-check', count: null },
    { title: 'Tipos', resource: 'types', path: '/working/a3b378b4', icon: 'bi-ui-checks', count: null },
    { title: 'Encuestas', resource: 'surveys', path: '/working/d5fb87de', icon: 'bi-clipboard-data', count: null },
    { title: 'Preguntas', resource: 'questions', path: '/working/d2e6ded6', icon: 'bi-question-circle', count: null },
    { title: 'Valores', resource: 'values', path: '/working/d76a0e67', icon: 'bi-list-check', count: null },
    { title: 'Respuestas', resource: 'answers', path: '/working/a5acf579', icon: 'bi-chat-left-text', count: null },
  ]);
  constructor() {
    for (const module of this.modules()) {
      this.api.page(module.resource, 0, 1).subscribe({
        next: (page) =>
          this.modules.update((modules) =>
            modules.map((item) =>
              item.resource === module.resource ? { ...item, count: page.total } : item,
            ),
          ),
      });
    }
    this.loading.set(false);
  }
}
