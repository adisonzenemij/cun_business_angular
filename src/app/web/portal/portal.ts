import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PtNavbar } from '../../shared/portal/pt-navbar/pt-navbar';
import { PtFooter } from '../../shared/portal/pt-footer/pt-footer';

@Component({
  imports: [RouterOutlet, PtNavbar],
  selector: 'app-portal',
  styleUrl: './portal.css',
  templateUrl: './portal.html',
})
export class Portal {}
