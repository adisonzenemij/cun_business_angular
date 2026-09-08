import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-working',
  styleUrl: './working.css',
  templateUrl: './working.html',
})
export class Working {}
