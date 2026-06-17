import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { authGuard } from './nucleo/guards/auth-guard';

export const routes: Routes = [
  // ── Rotas públicas (sem Sidebar) ──────────────────────────────────────
  {
    path: 'login',
    loadComponent: () => import('./funcionalidades/autenticacao/login/login').then(m => m.Login)
  },

  // ── Rotas internas (com AppShell + Sidebar) ───────────────────────────
  // CR-03: authGuard aplicado no pai para proteger TODAS as rotas filhas
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./funcionalidades/home/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'turmas',
        loadComponent: () => import('./funcionalidades/turma/turmas/turmas.component').then(m => m.TurmasComponent)
      },
      {
        path: 'alunos',
        loadComponent: () => import('./funcionalidades/estudante/alunos/alunos.component').then(m => m.AlunosComponent)
      },
      {
        path: 'calendario',
        loadComponent: () => import('./funcionalidades/calendario/calendario/calendario.component').then(m => m.CalendarioComponent)
      },
      {
        path: 'cadastro-responsavel',
        loadComponent: () => import('./funcionalidades/estudante/cadastro-responsavel/cadastro-responsavel.component').then(m => m.CadastroResponsavelComponent)
      },
      {
        path: 'cadastro-educador',
        loadComponent: () => import('./funcionalidades/educador/cadastro-educador/cadastro-educador.component').then(m => m.CadastroEducadorComponent)
      },
      {
        path: 'dashboard-responsavel',
        loadComponent: () => import('./funcionalidades/dashboard/dashboard-responsavel/dashboard-responsavel').then(m => m.DashboardResponsavel)
      }
    ]
  }
];
