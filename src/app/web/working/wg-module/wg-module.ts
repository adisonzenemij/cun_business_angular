import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FastApi } from '../../../services/backend/python/fast/fast-api';
import { MetadataCatalog, NavigationModule } from '../../../services/backend/python/fast/fast-resources';
import { ENTITY_CONFIGS } from '../entity-configs';

interface ModuleResource {
  id_universal: string;
  fd_name: string;
  route: string;
  icon: string;
  count: number | null;
}

@Component({
  imports: [RouterLink],
  selector: 'app-wg-module',
  styleUrl: './wg-module.css',
  templateUrl: './wg-module.html',
})
export class WgModule {
  private readonly api = inject(FastApi);
  private readonly catalog = inject(MetadataCatalog);
  private readonly route = inject(ActivatedRoute);
  private readonly moduleId = signal('');
  readonly module = computed(() => this.catalog.modules().find((module) => module.id_universal === this.moduleId()));
  readonly resources = signal<ModuleResource[]>([]);

  constructor() {
    this.catalog.load();
    this.route.paramMap.subscribe((params) => this.moduleId.set(params.get('moduleId') ?? ''));
    effect(() => this.loadResources(this.module()));
  }

  private loadResources(module: NavigationModule | undefined): void {
    if (!module) {
      this.resources.set([]);
      return;
    }
    const resources = module.resources.map((resource) => ({ ...resource, count: null }));
    this.resources.set(resources);
    for (const resource of resources) {
      const endpoint = ENTITY_CONFIGS[resource.route]?.resource;
      if (!endpoint) continue;
      this.api.page(endpoint, 0, 1).subscribe({
        next: (page) => this.resources.update((current) => current.map((item) =>
          item.id_universal === resource.id_universal ? { ...item, count: page.total } : item,
        )),
      });
    }
  }
}
