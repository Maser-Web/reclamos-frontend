/**
 * Estados canónicos de reclamos compartidos por toda la aplicación.
 * Importar estos valores en lugar de usar literales de estado.
 */
export const RECLAMO_ESTADOS = {
  RECIBIDOS: 'RECIBIDOS',
  EN_CURSO: 'EN_CURSO',
  FINALIZADO: 'FINALIZADO',
} as const;

export type EstadoReclamo = typeof RECLAMO_ESTADOS[keyof typeof RECLAMO_ESTADOS];

export const RECLAMO_ESTADOS_LISTA: readonly EstadoReclamo[] = [
  RECLAMO_ESTADOS.RECIBIDOS,
  RECLAMO_ESTADOS.EN_CURSO,
  RECLAMO_ESTADOS.FINALIZADO,
];

export const RECLAMO_ESTADO_ETIQUETAS: Record<EstadoReclamo, string> = {
  [RECLAMO_ESTADOS.RECIBIDOS]: 'Recibidos',
  [RECLAMO_ESTADOS.EN_CURSO]: 'En curso',
  [RECLAMO_ESTADOS.FINALIZADO]: 'Finalizado',
};

/** Valores que aceptan GET /reclamos y GET /reclamos/mis-reclamos en el parámetro `estado`. */
export type EstadoFiltroBackend = 'RECIBIDO' | 'EN CURSO' | 'FINALIZADO';

export const RECLAMO_ESTADO_FILTRO_BACKEND: Record<EstadoReclamo, EstadoFiltroBackend> = {
  [RECLAMO_ESTADOS.RECIBIDOS]: 'RECIBIDO',
  [RECLAMO_ESTADOS.EN_CURSO]: 'EN CURSO',
  [RECLAMO_ESTADOS.FINALIZADO]: 'FINALIZADO',
};
