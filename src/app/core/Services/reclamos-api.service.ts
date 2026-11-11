import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { BACKEND_ENDPOINTS } from '../endpoints/backend.endpoints';
import { ApiResponse } from '../interfaces/api-response.interface';
import { CrearReclamoPayload, ReclamoBackend } from '../interfaces/reclamo.interface';
import { Servicio } from '../interfaces/servicio.interface';
import { CacheReadOptions } from './usuario.service';

const JSON_HEADERS = new HttpHeaders({ 'Content-Type': 'application/json' });
const CACHE_TTL_MS = 10 * 60 * 1000;

/** Operaciones sin autenticación para crear reclamos y consultar servicios. */
@Injectable({ providedIn: 'root' })
export class ReclamosApiService {
  private readonly http = inject(HttpClient);
  private servicesCache: { value: Servicio[] | null; expiresAt: number } | null = null;
  private servicesInFlight: Observable<Servicio[] | null> | null = null;

  crearReclamo(payload: CrearReclamoPayload): Observable<ReclamoBackend | null> {
    return this.http.post<ApiResponse<ReclamoBackend>>(BACKEND_ENDPOINTS.reclamos.base, payload, {
      headers: JSON_HEADERS,
    }).pipe(map(response => response.data));
  }

  obtenerServicios(options: CacheReadOptions = {}): Observable<Servicio[] | null> {
    if (!options.forceRefresh && this.servicesCache && this.servicesCache.expiresAt > Date.now()) {
      return of(this.servicesCache.value);
    }
    if (this.servicesInFlight) return this.servicesInFlight;

    const request = this.http.get<ApiResponse<Servicio[]>>(BACKEND_ENDPOINTS.servicios.base, {
      headers: JSON_HEADERS,
    }).pipe(
      map(response => response.data),
      tap(value => this.servicesCache = { value, expiresAt: Date.now() + CACHE_TTL_MS }),
      finalize(() => this.servicesInFlight = null),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.servicesInFlight = request;
    return request;
  }

  obtenerServicioPorId(id: number): Observable<Servicio | null> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('El id del servicio debe ser un entero positivo');
    }
    return this.http.get<ApiResponse<Servicio>>(BACKEND_ENDPOINTS.servicios.byId(id), {
      headers: JSON_HEADERS,
    }).pipe(map(response => response.data));
  }
}
