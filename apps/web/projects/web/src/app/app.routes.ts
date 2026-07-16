import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { CoordinatorShellComponent } from './layout/coordinator-shell/coordinator-shell.component';
import { authGuard } from './nucleo/guards/auth-guard';
import { loginGuard } from './nucleo/guards/login-guard';
import { coordinatorGuard } from './nucleo/guards/coordinator-guard';
import { primeiroAcessoGuard } from './nucleo/guards/primeiro-acesso.guard';

export const routes: Routes = [
  // ── Rota raiz: redireciona para /login ────────────────────────────────
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // ── Rota pública: login ───────────────────────────────────────────────
  // loginGuard: usuário já autenticado é redirecionado para /home ou /coordenador/home
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./funcionalidades/autenticacao/login/login').then(m => m.Login)
  },

  {
    path: 'esqueceu-senha',
    canActivate: [loginGuard],
    loadComponent: () => import('./funcionalidades/autenticacao/esqueceu-senha/esqueceu-senha').then(m => m.EsqueceuSenhaComponent)
  },

  {
    path: 'redefinir-senha',
    canActivate: [loginGuard],
    loadComponent: () => import('./funcionalidades/autenticacao/redefinir-senha/redefinir-senha').then(m => m.RedefinirSenhaComponent)
  },

  {
    // Rota de primeiro acesso: requer autenticação mas NÃO requer senha já trocada
    path: 'primeiro-acesso',
    canActivate: [authGuard],
    loadComponent: () => import('./funcionalidades/autenticacao/redefinir-senha/redefinir-senha').then(m => m.RedefinirSenhaComponent)
  },

  // ── Rotas internas do Professor (com AppShell + Sidebar) ──────────────
  // authGuard + primeiroAcessoGuard protegem todas as rotas filhas
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard, primeiroAcessoGuard],
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
        loadComponent: () => import('./funcionalidades/dashboard/dashboard-responsavel/dashboard-responsavel.component').then(m => m.DashboardResponsavelComponent)
      }
    ]
  },

  // ── Rotas internas do Coordenador (com CoordinatorShell + Sidebar) ────
  // authGuard + coordinatorGuard + primeiroAcessoGuard protegem todas as rotas filhas
  {
    path: 'coordenador',
    component: CoordinatorShellComponent,
    canActivate: [authGuard, coordinatorGuard, primeiroAcessoGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./funcionalidades/coordenador/home/coordenador-home.component').then(m => m.CoordenadorHomeComponent)
      },
      {
        path: 'alunos',
        loadComponent: () => import('./funcionalidades/coordenador/alunos/coordenador-alunos.component').then(m => m.CoordenadorAlunosComponent)
      },
      {
        path: 'turmas',
        loadComponent: () => import('./funcionalidades/coordenador/turmas/coordenador-turmas.component').then(m => m.CoordenadorTurmasComponent)
      },
      {
        path: 'professores',
        loadComponent: () => import('./funcionalidades/coordenador/professores/coordenador-professores.component').then(m => m.CoordenadorProfessoresComponent)
      },
      {
        path: 'calendario',
        loadComponent: () => import('./funcionalidades/coordenador/calendario/coordenador-calendario.component').then(m => m.CoordenadorCalendarioComponent)
      },
    ]
  },

  // ── Wildcard: qualquer rota desconhecida → /login ─────────────────────
  {
    path: '**',
    redirectTo: 'login',
  },
];

