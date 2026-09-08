import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WgNavbar } from '../../shared/working/wg-navbar/wg-navbar';
import { WgSidebar } from '../../shared/working/wg-sidebar/wg-sidebar';
import { WgFooter } from '../../shared/working/wg-footer/wg-footer';
import { SidebarState } from '../../services/core/sidebar-state';

@Component({
  imports: [WgNavbar, WgSidebar, WgFooter, RouterOutlet],
  selector: 'app-working',
  styleUrl: './working.css',
  templateUrl: './working.html',
})
export class Working {
  readonly sidebar = inject(SidebarState);
}
