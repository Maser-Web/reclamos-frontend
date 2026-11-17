import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';

/** Evita acceder a rutas públicas (login) con una sesión activa; solo se llega cerrando sesión. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/reclamos']) : true;
};
