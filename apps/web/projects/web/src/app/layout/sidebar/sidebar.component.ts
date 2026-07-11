import { Component, signal, inject, OnInit, PLATFORM_ID, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass, isPlatformBrowser } from '@angular/common';
import { MenuItem, DEFAULT_MENU, LOGOUT_ITEM } from '../sidebar/menu-items';
import { AuthService } from '../../nucleo/services/auth'; // Ajuste o caminho se necessário

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush })
export class SidebarComponent implements OnInit {
  readonly menu = input<MenuItem[]>(DEFAULT_MENU);
  logout = LOGOUT_ITEM;

  userName = signal('Usuário');
  currentDate = signal(
    (() => {
      const raw = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
      const partes = raw.split(' ');
      if (partes[2]) {
        partes[2] = partes[2].charAt(0).toUpperCase() + partes[2].slice(1);
      }
      return partes.join(' ');
    })(),
  );

  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const nomeReal = this.authService.getLoggedUserName();
      this.userName.set(nomeReal);
    }
  }

  fazerLogout(): void {
    this.authService.logout();
  }
}
