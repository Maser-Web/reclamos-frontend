import type { EstadoReclamo } from '../constants/reclamo-estados';

export type EstadoReclamoBackend = 'RECIBIDO' | 'ASIGNADO' | 'FINALIZADO';

/** Único cuerpo admitido por POST /reclamos. */
export interface CrearReclamoPayload {
  motivo: string;
  usu_codigo: number;
}

/**
 * Respuesta de GET /reclamos y GET /reclamos/mis-reclamos (`?estado&limit&offset`).
 * `data` trae solo los reclamos de la página; no hay `total`.
 */
export interface ReclamosPaginaResponse {
  codigo: number;
  mensaje: string;
  data: ReclamoBackend[] | null;
  hasNext: boolean;
}

export interface ActualizarEstadoRequest {
  comentario?: string;
}

/** Shape returned by the reclamos backend. Numeric SQL identifiers are strings. */
export interface ReclamoBackend {
  recCodigo: string;
  recFecha: string | null;
  recHora: string | null;
  recMotivo: string | null;
  /** Descripción del motivo, incluida cuando el backend resuelve el catálogo de motivos. */
  mtrDescri?: string | null;
  recTcid: string | null;
  /** Nombre del cliente, disponible al consultar el detalle: GET /reclamos/:id. */
  cliNombre?: string | null;
  /** Descripción del servicio, incluida por el backend junto al reclamo. */
  recServicio: number | null;
  recRecibio: string | null;
  recSucursal: number | null;
  recFecalta: string | null;
  recHoraalta: string | null;
  recPlamov: string | null;
  recEstado: EstadoReclamoBackend | null;
  recDerivo: string | null;
  /** Nombre del usuario derivado, disponible cuando el backend lo incluye. */
  usuNombreDerivado?: string | null;
  /** Nombre del vendedor asociado al reclamo devuelto por el backend. */
  venNombre?: string | null;
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
