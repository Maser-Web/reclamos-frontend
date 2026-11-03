import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BACKEND_ENDPOINTS } from '../endpoints/backend.endpoints';
import { ApiResponse } from '../interfaces/api-response.interface';
import { CrearReclamoPayload, ReclamoBackend } from '../interfaces/reclamo.interface';
import { Servicio } from '../interfaces/servicio.interface';

const JSON_HEADERS = new HttpHeaders({ 'Content-Type': 'application/json' });

/** Operaciones sin autenticación para crear reclamos y consultar servicios. */
@Injectable({ providedIn: 'root' })
export class ReclamosApiService {
  private readonly http = inject(HttpClient);

  crearReclamo(payload: CrearReclamoPayload): Observable<ReclamoBackend | null> {
    return this.http.post<ApiResponse<ReclamoBackend>>(BACKEND_ENDPOINTS.reclamos.base, payload, {
      headers: JSON_HEADERS,
    }).pipe(map(response => response.data));
  }

  obtenerServicios(): Observable<Servicio[] | null> {
    return this.http.get<ApiResponse<Servicio[]>>(BACKEND_ENDPOINTS.servicios.base, {
      headers: JSON_HEADERS,
    }).pipe(map(response => response.data));
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
