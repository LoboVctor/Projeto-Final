import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

/**
 * Impede que um usuário já autenticado acesse a tela de login.
 * Se estiver logado, redireciona direto para /home.
 */
export const loginGuard: CanActivateFn = () => {
  if (!inject(AuthService).isAuthenticated()) return true;
  inject(Router).navigate(['/home']);
  return false;
};
