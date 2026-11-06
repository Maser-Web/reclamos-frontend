import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';

/** Impide abrir la adhesión a perfiles que no pueden gestionarla. */
export const adherirReclamoGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  if (auth.puedeAdherirReclamo()) return true;
  return inject(Router).createUrlTree(['/reclamos', route.paramMap.get('id')]);
};
