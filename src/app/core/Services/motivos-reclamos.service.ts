import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BACKEND_ENDPOINTS } from '../endpoints/backend.endpoints';
import { ApiResponse } from '../interfaces/api-response.interface';
import { MotivoReclamo } from '../interfaces/motivo-reclamo.interface';

@Injectable({ providedIn: 'root' })
export class MotivosReclamosService {
  private readonly http = inject(HttpClient);

  apertura(): Observable<MotivoReclamo[]> { return this.list(BACKEND_ENDPOINTS.motivosReclamos.apertura, 1); }
  clausura(): Observable<MotivoReclamo[]> { return this.list(BACKEND_ENDPOINTS.motivosReclamos.clausura, 2); }

  private list(url: string, tipo: MotivoReclamo['mtrTipo']): Observable<MotivoReclamo[]> {
    return this.http.get<ApiResponse<MotivoReclamo[]>>(url).pipe(
      map(response => (response.data ?? []).filter(motivo => motivo.mtrTipo === tipo && Boolean(motivo.mtrDescri?.trim()))),
    );
  }
}
