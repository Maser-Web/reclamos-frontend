import type { EstadoReclamo } from '../constants/reclamo-estados';

export type EstadoReclamoBackend = 'RECIBIDO' | 'ASIGNADO' | 'FINALIZADO';

/** Único cuerpo admitido por POST /reclamos. */
export interface CrearReclamoPayload {
  motivo: string;
  usu_codigo: number;
  servicio: number;
}

export interface ReclamosPaginationQuery {
  limit?: string;
  offset?: string;
}

export interface ActualizarEstadoRequest {
  usuCodigo: string;
  comentario?: string;
}

/** Shape returned by the reclamos backend. Numeric SQL identifiers are strings. */
export interface ReclamoBackend {
  recCodigo: string;
  recFecha: string | null;
  recHora: string | null;
  recMotivo: string | null;
  recTcid: string | null;
  recServicio: number | null;
  recRecibio: string | null;
  recSucursal: number | null;
  recFecalta: string | null;
  recHoraalta: string | null;
  recPlamov: string | null;
  recEstado: EstadoReclamoBackend | null;
  recDerivo: string | null;
  /** Disponible al consultar el detalle: GET /reclamos/:id. */
  usuNombreDerivado?: string | null;
  recFechaD: string | null;
  recHoraD: string | null;
  recFechaF: string | null;
  recHoraF: string | null;
  recUsuarioF: number | null;
  recEstadoMsg: number | null;
  recEnviado: number | null;
  recTipo: number | null;
  recComentarioF: string | null;
  recPrioridad: string | null;
}

/** Registro de cambio de estado devuelto por GET /reclamos/:id/historial. */
export interface HistorialReclamoBackend {
  hisCodigo: number | string;
  hisEstadoAnterior: string | null;
  hisEstadoNuevo: string | null;
  hisFechaCambio: string | null;
  hisHoraCambio: string | null;
  hisCodigoReclamo: number | string;
  hisUsuarioCambio: number | string | null;
}
