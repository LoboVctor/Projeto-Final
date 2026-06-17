import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  if (inject(AuthService).isAuthenticated()) return true;
  inject(Router).navigate(['/login']);
  return false;
};