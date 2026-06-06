import { Routes } from '@angular/router';

export const routes: Routes = [
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
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];
