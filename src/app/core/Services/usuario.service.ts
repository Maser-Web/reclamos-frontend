import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { BACKEND_ENDPOINTS } from '../endpoints/backend.endpoints';
import { CrearUsuarioRequest, Usuario, UsuarioCreado } from '../interfaces/usuario.interface';
import { ApiResponse } from '../interfaces/api-response.interface';

export interface CacheReadOptions { forceRefresh?: boolean; }

const CACHE_TTL_MS = 10 * 60 * 1000;

/** Mantiene el usuario autenticado y centraliza las operaciones de cuenta. */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private cache: { ownerId: number | null; value: Usuario[]; expiresAt: number } | null = null;
  private inFlight: { ownerId: number | null; request: Observable<Usuario[]> } | null = null;

  readonly actual = computed<Usuario | null>(() => {
    const usuCodigo = this.auth.usuarioCodigo();
    return usuCodigo === null
      ? null
      : { usuCodigo, usuNombre: null, usuLogin: null, usuPerfil: null };
  });

  crear(datos: CrearUsuarioRequest): Observable<UsuarioCreado> {
    return this.http.post<UsuarioCreado>(BACKEND_ENDPOINTS.usuario.base, {
      usuNombre: datos.usuNombre.trim(),
      usuContrasena: datos.usuContrasena,
      usuFecnac: datos.usuFecnac,
    });
  }

  /** Obtiene los usuarios disponibles para asociar a un reclamo. */
  listar(options: CacheReadOptions = {}): Observable<Usuario[]> {
    const ownerId = this.auth.usuarioId();
    if (this.cache?.ownerId !== ownerId) this.cache = null;
    if (this.inFlight?.ownerId !== ownerId) this.inFlight = null;

    if (!options.forceRefresh && this.cache && this.cache.expiresAt > Date.now()) {
      return of(this.cache.value);
    }
    if (this.inFlight) return this.inFlight.request;

    const request = this.http.get<ApiResponse<Usuario[]> | Usuario[]>(BACKEND_ENDPOINTS.usuario.base).pipe(
      map(response => Array.isArray(response) ? response : response.data ?? []),
      tap(value => {
        if (this.auth.usuarioId() === ownerId) {
          this.cache = { ownerId, value, expiresAt: Date.now() + CACHE_TTL_MS };
        }
      }),
      finalize(() => {
        if (this.inFlight?.ownerId === ownerId) this.inFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.inFlight = { ownerId, request };
    return request;
  }
}
