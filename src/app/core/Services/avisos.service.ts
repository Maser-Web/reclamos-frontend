import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { BACKEND_ENDPOINTS } from '../endpoints/backend.endpoints';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Aviso } from '../interfaces/aviso.interface';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly avisos = signal<Aviso[]>([]);
  readonly pendientes = computed(() => this.avisos().filter(aviso => aviso.aviVisto !== true).length);

  consultarAvisos(): Observable<Aviso[]> {
    const headers = this.authenticatedHeaders();
    if (!headers) return throwError(() => new Error('No hay una sesión activa'));
    const usuarioId = this.auth.usuarioId();
    if (usuarioId === null) return throwError(() => new Error('No hay un usuario en la sesión'));
    return this.http.get<ApiResponse<Aviso[]>>(BACKEND_ENDPOINTS.avisos.byUsuario(usuarioId), { headers }).pipe(
      map(response => response.data ?? []),
      tap(avisos => this.avisos.set(avisos)),
      catchError(error => this.handleError(error)),
    );
  }

  marcarComoLeido(aviCod: number): Observable<void> {
    const headers = this.authenticatedHeaders();
    if (!headers) return throwError(() => new Error('No hay una sesión activa'));
    return this.http.patch<ApiResponse<null>>(BACKEND_ENDPOINTS.avisos.visto(aviCod), undefined, { headers }).pipe(
      map(() => undefined),
      tap(() => this.avisos.update(avisos => avisos.map(aviso =>
        aviso.aviCod === aviCod ? { ...aviso, aviVisto: true } : aviso,
      ))),
      catchError(error => this.handleError(error)),
    );
  }

  limpiar(): void {
    this.avisos.set([]);
  }

  private authenticatedHeaders(): HttpHeaders | null {
    const accessToken = this.auth.accessToken();
    if (!accessToken) return null;
    return new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    });
  }

  private handleError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse && error.status === 401) this.auth.logout();
    return throwError(() => error);
  }
}
