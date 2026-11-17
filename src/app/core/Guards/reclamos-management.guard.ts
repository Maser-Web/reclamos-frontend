import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';

/** Restricts claim-changing screens to usuAdminReclamo === 1. */
export const reclamosManagementGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  if (auth.puedeGestionarReclamos()) return true;
  const id = route.paramMap.get('id');
  return inject(Router).createUrlTree(id ? ['/reclamos', id] : ['/reclamos']);
};
