import { Component, Input, signal, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgSwitch, NgSwitchCase, NgClass, isPlatformBrowser } from '@angular/common';
import { MenuItem, DEFAULT_MENU, LOGOUT_ITEM } from '../sidebar/menu-items';
import { AuthService } from '../../core/services/auth'; // Ajuste o caminho se necessário

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor, NgSwitch, NgSwitchCase, NgClass],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  @Input() menu: MenuItem[] = DEFAULT_MENU;
  logout = LOGOUT_ITEM;
  
  userName = signal('Usuário');
  currentDate = signal(new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()));

  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Consome diretamente o novo método centralizado
      const nomeReal = this.authService.getLoggedUserName();
      this.userName.set(nomeReal);
    }
  }
}