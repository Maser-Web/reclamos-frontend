import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BACKEND_ENDPOINTS } from '../endpoints/backend.endpoints';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Cliente } from '../interfaces/cliente.interface';

/** Búsqueda remota y paginada de clientes disponibles para reclamos. */
@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly http = inject(HttpClient);

  buscar(query: string, limit = 20, offset = 0): Observable<ApiResponse<Cliente[]>> {
    const q = query.trim();
    if (!q) throw new Error('El texto de búsqueda es obligatorio');
    if (!/^\d+$/.test(q) && q.length < 2) throw new Error('La búsqueda por nombre requiere al menos 2 caracteres');
    if (/^0+$/.test(q)) throw new Error('El código de cliente debe ser un entero positivo');
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('El límite debe estar entre 1 y 100');
    if (!Number.isInteger(offset) || offset < 0) throw new Error('El desplazamiento debe ser mayor o igual a 0');

    const params = new HttpParams()
      .set('q', q)
      .set('limit', String(limit))
      .set('offset', String(offset));
    return this.http.get<ApiResponse<Cliente[]>>(BACKEND_ENDPOINTS.clientes.buscar, { params });
  }
}
