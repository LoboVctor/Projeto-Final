import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { COORDINATOR_MENU } from '../sidebar/menu-items';

@Component({
  selector: 'app-coordinator-shell',
  imports: [SidebarComponent, RouterOutlet],
  templateUrl: './coordinator-shell.component.html',
  styleUrl: './coordinator-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatorShellComponent {
  readonly coordinatorMenu = COORDINATOR_MENU;
}
