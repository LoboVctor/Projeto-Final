import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

/**
 * Impede que um usuário já autenticado acesse a tela de login.
 * Se estiver logado, redireciona para a rota correspondente ao seu papel:
 *  - COORDENADOR → /coordenador/home
 *  - demais → /home
 */
export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) return true;

  if (authService.isCoordenador()) {
    router.navigate(['/coordenador/home']);
  } else {
    router.navigate(['/home']);
  }

  return false;
};
