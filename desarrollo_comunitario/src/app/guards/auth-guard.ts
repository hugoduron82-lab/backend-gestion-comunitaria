// guards/auth-guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.getToken()) {
    return true; // hay sesión, deja pasar
  }

  router.navigate(['/login']); // no hay sesión, redirige
  return false;
};