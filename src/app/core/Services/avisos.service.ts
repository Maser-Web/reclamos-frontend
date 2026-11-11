import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { BACKEND_ENDPOINTS } from '../endpoints/backend.endpoints';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Aviso } from '../interfaces/aviso.interface';
import { AuthService } from './auth.service';
import { CacheReadOptions } from './usuario.service';

const CACHE_TTL_MS = 30 * 1000;

@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly avisos = signal<Aviso[]>([]);
  readonly pendientes = computed(() => this.avisos().filter(aviso => aviso.aviVisto !== true).length);
  private cacheOwnerId: number | null = null;
  private cacheExpiresAt = 0;
  private inFlight: { ownerId: number; request: Observable<Aviso[]> } | null = null;

  consultarAvisos(options: CacheReadOptions = {}): Observable<Aviso[]> {
    const headers = this.authenticatedHeaders();
    if (!headers) return throwError(() => new Error('No hay una sesión activa'));
    const usuarioId = this.auth.usuarioId();
    if (usuarioId === null) return throwError(() => new Error('No hay un usuario en la sesión'));
    this.resetForOwner(usuarioId);
    if (!options.forceRefresh && this.cacheExpiresAt > Date.now()) return of(this.avisos());
    if (this.inFlight?.ownerId === usuarioId) return this.inFlight.request;

    const request = this.http.get<ApiResponse<Aviso[]>>(BACKEND_ENDPOINTS.avisos.byUsuario(usuarioId), { headers }).pipe(
      map(response => response.data ?? []),
      tap(avisos => {
        if (this.auth.usuarioId() !== usuarioId) return;
        this.avisos.set(avisos);
        this.cacheExpiresAt = Date.now() + CACHE_TTL_MS;
      }),
      catchError(error => this.handleError(error)),
      finalize(() => {
        if (this.inFlight?.ownerId === usuarioId) this.inFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.inFlight = { ownerId: usuarioId, request };
    return request;
  }

  marcarComoLeido(aviCod: number): Observable<void> {
    const headers = this.authenticatedHeaders();
    if (!headers) return throwError(() => new Error('No hay una sesión activa'));
    return this.http.patch<ApiResponse<null>>(BACKEND_ENDPOINTS.avisos.visto(aviCod), undefined, { headers }).pipe(
      map(() => undefined),
      tap(() => this.avisos.update(avisos => avisos.map(aviso =>
        aviso.aviCod === aviCod ? { ...aviso, aviVisto: true } : aviso,
      ))),
      tap(() => this.cacheExpiresAt = Date.now() + CACHE_TTL_MS),
      catchError(error => this.handleError(error)),
    );
  }

  limpiar(): void {
    this.avisos.set([]);
    this.cacheOwnerId = null;
    this.cacheExpiresAt = 0;
    this.inFlight = null;
  }

  private resetForOwner(ownerId: number): void {
    if (this.cacheOwnerId === ownerId) return;
    this.cacheOwnerId = ownerId;
    this.cacheExpiresAt = 0;
    this.avisos.set([]);
    this.inFlight = null;
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
