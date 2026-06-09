import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // ── Rotas públicas (sem Sidebar) ──────────────────────────────────────
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },

  // ── Rotas internas (com AppShell + Sidebar) ───────────────────────────
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'turmas',
        loadComponent: () => import('./pages/turmas/turmas.component').then(m => m.TurmasComponent)
      },
      {
        path: 'alunos',
        loadComponent: () => import('./pages/alunos/alunos.component').then(m => m.AlunosComponent)
      },
      {
        path: 'calendario',
        loadComponent: () => import('./pages/calendario/calendario.component').then(m => m.CalendarioComponent)
      },
      {
        path: 'cadastro-responsavel',
        loadComponent: () => import('./pages/cadastro-responsavel/cadastro-responsavel.component').then(m => m.CadastroResponsavelComponent)
      },
      {
        path: 'cadastro-educador',
        loadComponent: () => import('./pages/cadastro-educador/cadastro-educador.component').then(m => m.CadastroEducadorComponent)
      },
      {
        path: 'dashboard-responsavel',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard-responsavel/dashboard-responsavel').then(m => m.DashboardResponsavel)
      }
    ]
  }
];

