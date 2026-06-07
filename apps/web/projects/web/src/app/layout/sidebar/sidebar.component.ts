import { Component, Input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgSwitch, NgSwitchCase, NgClass } from '@angular/common';
import { MenuItem, DEFAULT_MENU, LOGOUT_ITEM } from '../sidebar/menu-items';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor, NgSwitch, NgSwitchCase, NgClass],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() menu: MenuItem[] = DEFAULT_MENU;
  logout = LOGOUT_ITEM;
  userName = signal('Usuário');
  currentDate = signal(new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()));
}
