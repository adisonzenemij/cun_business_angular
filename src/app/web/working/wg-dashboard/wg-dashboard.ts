import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MetadataCatalog } from '../../../services/backend/python/fast/fast-resources';

@Component({
  imports: [RouterLink],
  selector: 'app-wg-dashboard',
  styleUrl: './wg-dashboard.css',
  templateUrl: './wg-dashboard.html',
})
export class WgDashboard {
  private readonly catalog = inject(MetadataCatalog);
  readonly modules = this.catalog.modules;
  constructor() {
    this.catalog.load();
  }
}
