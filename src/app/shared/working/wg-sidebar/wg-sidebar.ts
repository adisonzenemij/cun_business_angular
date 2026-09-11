import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarState } from '../../../services/core/sidebar-state';
import { MetadataCatalog } from '../../../services/backend/python/fast/fast-resources';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-wg-sidebar',
  styleUrl: './wg-sidebar.css',
  templateUrl: './wg-sidebar.html',
})
export class WgSidebar {
  readonly sidebar = inject(SidebarState);
  readonly catalog = inject(MetadataCatalog);
  constructor() { this.catalog.load(); }
}
