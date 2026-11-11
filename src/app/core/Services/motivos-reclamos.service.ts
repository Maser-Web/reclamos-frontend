import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { BACKEND_ENDPOINTS } from '../endpoints/backend.endpoints';
import { ApiResponse } from '../interfaces/api-response.interface';
import { MotivoReclamo } from '../interfaces/motivo-reclamo.interface';
import { CacheReadOptions } from './usuario.service';

const CACHE_TTL_MS = 10 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class MotivosReclamosService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<MotivoReclamo['mtrTipo'], { value: MotivoReclamo[]; expiresAt: number }>();
  private readonly inFlight = new Map<MotivoReclamo['mtrTipo'], Observable<MotivoReclamo[]>>();

  apertura(options: CacheReadOptions = {}): Observable<MotivoReclamo[]> { return this.list(BACKEND_ENDPOINTS.motivosReclamos.apertura, 1, options); }
  clausura(options: CacheReadOptions = {}): Observable<MotivoReclamo[]> { return this.list(BACKEND_ENDPOINTS.motivosReclamos.clausura, 2, options); }

  private list(url: string, tipo: MotivoReclamo['mtrTipo'], options: CacheReadOptions): Observable<MotivoReclamo[]> {
    const cached = this.cache.get(tipo);
    if (!options.forceRefresh && cached && cached.expiresAt > Date.now()) return of(cached.value);
    const activeRequest = this.inFlight.get(tipo);
    if (activeRequest) return activeRequest;

    const request = this.http.get<ApiResponse<MotivoReclamo[]>>(url).pipe(
      map(response => (response.data ?? []).filter(motivo => motivo.mtrTipo === tipo && Boolean(motivo.mtrDescri?.trim()))),
      tap(value => this.cache.set(tipo, { value, expiresAt: Date.now() + CACHE_TTL_MS })),
      finalize(() => this.inFlight.delete(tipo)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.inFlight.set(tipo, request);
    return request;
  }
}
