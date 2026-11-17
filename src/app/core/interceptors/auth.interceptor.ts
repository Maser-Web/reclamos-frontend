import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { BACKEND_ENDPOINTS } from '../endpoints/backend.endpoints';
import { AuthService } from '../Services/auth.service';
import { NotificationService } from '../Services/notification.service';

/** Adds the active session token to every protected backend request. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notifications = inject(NotificationService);
  const isBackendRequest = request.url.startsWith(BACKEND_ENDPOINTS.health);
  const isLoginRequest = request.url === BACKEND_ENDPOINTS.auth.login;
  const accessToken = auth.accessToken();
  const authenticatedRequest = isBackendRequest && !isLoginRequest && accessToken
    ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (isBackendRequest && !isLoginRequest && error instanceof HttpErrorResponse && error.status === 401) {
        const returnUrl = router.url;
        auth.logout();
        if (!returnUrl.startsWith('/login')) {
          void router.navigate(['/login'], { queryParams: { returnUrl } });
        }
      }
      if (isBackendRequest && error instanceof HttpErrorResponse && error.status === 403) {
        void notifications.error('Acceso restringido', 'No tenés permisos para realizar esta operación.');
      }
      return throwError(() => error);
    }),
  );
};
