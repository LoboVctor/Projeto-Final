import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

/**
 * Bloqueia o acesso às rotas internas se o usuário ainda precisar
 * trocar a senha no primeiro acesso, redirecionando para /primeiro-acesso.
 */
export const primeiroAcessoGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.deveMudarSenha()) {
    router.navigate(['/primeiro-acesso']);
    return false;
  }

  return true;
};
