import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

/**
 * Protege as rotas exclusivas do coordenador.
 * Apenas usuários com role COORDENADOR têm acesso.
 * Caso contrário, redireciona para /home.
 */
export const coordinatorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isCoordenador()) return true;

  router.navigate(['/home']);
  return false;
};
