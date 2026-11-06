import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { BACKEND_ENDPOINTS } from '../endpoints/backend.endpoints';
import { ApiResponse } from '../interfaces/api-response.interface';
import {
  ActualizarEstadoRequest,
  HistorialReclamoBackend,
  ReclamoBackend,
  ReclamosPaginationQuery,
} from '../interfaces/reclamo.interface';
import { PrioridadReclamo, ReclamoVista, Seguimiento } from '../interfaces/models';
import { EstadoReclamo, RECLAMO_ESTADOS, RECLAMO_ESTADOS_LISTA, RECLAMO_ESTADO_ETIQUETAS } from '../constants/reclamo-estados';

export type { ReclamoVista } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class ReclamosService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  list(query: ReclamosPaginationQuery = {}): Observable<ReclamoVista[]> {
    const params = this.paginationParams(query);
    return this.http.get<ApiResponse<ReclamoBackend[]>>(BACKEND_ENDPOINTS.reclamos.base, { params }).pipe(
      map(response => this.unwrap(response).map(reclamo => this.toVista(reclamo))),
    );
  }

  detail(id: string): Observable<ReclamoVista> {
    this.assertPositiveInteger(id, 'El id del reclamo debe ser un entero positivo');
    return this.http.get<ApiResponse<ReclamoBackend>>(BACKEND_ENDPOINTS.reclamos.byId(id)).pipe(
      map(response => this.toVista(this.unwrap(response))),
    );
  }

  byUsuario(usuCodigo: string): Observable<ReclamoVista[]> {
    this.assertPositiveInteger(usuCodigo, 'El código de usuario debe ser un entero positivo');
    return this.http.get<ApiResponse<ReclamoBackend[]>>(BACKEND_ENDPOINTS.reclamos.byUsuario(usuCodigo)).pipe(
      map(response => this.unwrap(response).map(reclamo => this.toVista(reclamo))),
    );
  }

  /** Reclamos adheridos al usuario de la sesión autenticada. */
  misReclamos(): Observable<ReclamoVista[]> {
    const accessToken = this.auth.accessToken();
    if (!accessToken) return throwError(() => new Error('No hay una sesión activa'));
    return this.http.get<ApiResponse<ReclamoBackend[]>>(BACKEND_ENDPOINTS.reclamos.misReclamos, {
      headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }),
    }).pipe(map(response => this.unwrap(response).map(reclamo => this.toVista(reclamo))));
  }

  historial(id: string): Observable<Seguimiento[]> {
    this.assertPositiveInteger(id, 'El id del reclamo debe ser un entero positivo');
    return this.http.get<ApiResponse<HistorialReclamoBackend[]>>(BACKEND_ENDPOINTS.reclamos.historial(id)).pipe(
      map(response => this.unwrap(response).map(historial => this.toSeguimiento(historial))),
    );
  }

  actualizarEstado(
    id: string,
    estado: EstadoReclamo,
    payload: ActualizarEstadoRequest,
  ): Observable<void> {
    this.assertPositiveInteger(id, 'El id del reclamo debe ser un entero positivo');
    this.assertPositiveInteger(payload.usuCodigo, 'El código de usuario debe ser un entero positivo');
    const estadoNormalizado = estado.toUpperCase() as EstadoReclamo;
    if (!RECLAMO_ESTADOS_LISTA.includes(estadoNormalizado)) {
      throw new Error('El estado solicitado no es válido');
    }
    return this.http.patch<ApiResponse<null>>(
      BACKEND_ENDPOINTS.reclamos.actualizarEstado(id, this.toEstadoBackend(estadoNormalizado)),
      payload,
    ).pipe(map(response => {
      if (response.codigo < 200 || response.codigo >= 300) throw new Error(response.mensaje);
    }));
  }

  asignarPrioridad(id: string, prioridad: PrioridadReclamo): Observable<void> {
    this.assertPositiveInteger(id, 'El id del reclamo debe ser un entero positivo');
    return this.http.patch<ApiResponse<null>>(
      BACKEND_ENDPOINTS.reclamos.asignarPrioridad(id),
      { prioridad: prioridad.toUpperCase() },
    ).pipe(map(response => {
      if (response.codigo < 200 || response.codigo >= 300) throw new Error(response.mensaje);
    }));
  }

  private paginationParams(query: ReclamosPaginationQuery): HttpParams {
    const limit = query.limit ?? '10';
    const offset = query.offset ?? '0';
    if (!/^[1-9]\d*$/.test(limit) || Number(limit) > 100) {
      throw new Error('El límite debe ser un entero entre 1 y 100');
    }
    if (!/^\d+$/.test(offset)) throw new Error('El offset debe ser un entero mayor o igual a 0');
    return new HttpParams().set('limit', limit).set('offset', offset);
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (response.data === null) throw new Error(response.mensaje);
    return response.data;
  }

  private assertPositiveInteger(value: string, message: string): void {
    if (!/^[1-9]\d*$/.test(value)) throw new Error(message);
  }

  private toVista(reclamo: ReclamoBackend): ReclamoVista {
    const estado = this.toEstadoVista(reclamo.recEstado);
    const fechaCreacion = reclamo.recFecha ?? reclamo.recFecalta ?? new Date(0).toISOString();
    return {
      id: reclamo.recCodigo,
      numero: `${reclamo.recCodigo}`,
      asunto: reclamo.recMotivo?.trim() || `Reclamo ${reclamo.recCodigo}`,
      serDescri: reclamo.serDescri?.trim() || 'Sin servicio informado.',
      descripcion: reclamo.recMotivo?.trim() || 'Sin descripción disponible.',
      estado,
      prioridad: this.toPrioridadVista(reclamo.recPrioridad),
      clienteId: reclamo.cliNombre ?? '',
      areaId: null,
      responsableId: reclamo.recDerivo,
      responsableNombre: reclamo.usuNombreDerivado ?? null,
      fechaCreacion,
      horaCreacion: reclamo.recHora,
      fechaDerivacion: reclamo.recFechaD,
      horaDerivacion: reclamo.recHoraD,
      fechaFinalizacion: reclamo.recFechaF,
      horaFinalizacion: reclamo.recHoraF,
      fechaActualizacion: reclamo.recFechaF ?? reclamo.recFechaD ?? reclamo.recFecalta ?? fechaCreacion,
      archivos: [],
    };
  }

  private toEstadoVista(estado: string | null): EstadoReclamo {
    switch (estado?.trim().toUpperCase()) {
      case 'RECIBIDO':
      case RECLAMO_ESTADOS.RECIBIDOS:
        return RECLAMO_ESTADOS.RECIBIDOS;
      case 'ASIGNADO':
      case 'EN CURSO':
      case RECLAMO_ESTADOS.EN_CURSO:
        return RECLAMO_ESTADOS.EN_CURSO;
      case RECLAMO_ESTADOS.FINALIZADO:
        return RECLAMO_ESTADOS.FINALIZADO;
      default:
        return RECLAMO_ESTADOS.RECIBIDOS;
    }
  }

  private toPrioridadVista(prioridad: string | null): PrioridadReclamo {
    switch (prioridad?.trim().toLowerCase()) {
      case 'alta': return 'alta';
      case 'baja': return 'baja';
      default: return 'media';
    }
  }

  private toSeguimiento(historial: HistorialReclamoBackend): Seguimiento {
    const estadoAnterior = this.toEstadoHistorial(historial.hisEstadoAnterior);
    const estadoNuevo = this.toEstadoHistorial(historial.hisEstadoNuevo) ?? RECLAMO_ESTADOS.RECIBIDOS;
    const tipo = estadoNuevo === RECLAMO_ESTADOS.FINALIZADO ? 'cerrado' : estadoNuevo === RECLAMO_ESTADOS.EN_CURSO ? 'asignado' : 'creado';
    const detalle = estadoAnterior ? `De ${RECLAMO_ESTADOS_LISTA.includes(estadoAnterior) ? this.estadoEtiqueta(estadoAnterior) : estadoAnterior} a ${this.estadoEtiqueta(estadoNuevo)}` : undefined;
    return {
      id: String(historial.hisCodigo),
      reclamoId: String(historial.hisCodigoReclamo),
      titulo: `Estado actualizado a ${this.estadoEtiqueta(estadoNuevo)}`,
      detalle,
      autor: historial.hisUsuarioCambio === null ? undefined : `Usuario ${historial.hisUsuarioCambio}`,
      fecha: historial.hisFechaCambio ?? '',
      hora: historial.hisHoraCambio ?? undefined,
      tipo,
    };
  }

  private toEstadoHistorial(estado: string | null): EstadoReclamo | null {
    switch (estado?.trim().toUpperCase()) {
      case 'RECIBIDO':
      case RECLAMO_ESTADOS.RECIBIDOS: return RECLAMO_ESTADOS.RECIBIDOS;
      case 'ASIGNADO':
      case 'EN CURSO':
      case RECLAMO_ESTADOS.EN_CURSO: return RECLAMO_ESTADOS.EN_CURSO;
      case RECLAMO_ESTADOS.FINALIZADO: return RECLAMO_ESTADOS.FINALIZADO;
      default: return null;
    }
  }

  private estadoEtiqueta(estado: EstadoReclamo): string {
    return RECLAMO_ESTADO_ETIQUETAS[estado];
  }

  /** El contrato del backend conserva ASIGNADO aunque la UI lo llama EN CURSO. */
  private toEstadoBackend(estado: EstadoReclamo): string {
    return estado === RECLAMO_ESTADOS.EN_CURSO ? 'ASIGNADO' : estado;
  }
}
