/**
 * Estados canónicos de reclamos compartidos por toda la aplicación.
 * Importar estos valores en lugar de usar literales de estado.
 */
export const RECLAMO_ESTADOS = {
  RECIBIDOS: 'RECIBIDOS',
  ASIGNADOS: 'ASIGNADOS',
  FINALIZADO: 'FINALIZADO',
} as const;

export type EstadoReclamo = typeof RECLAMO_ESTADOS[keyof typeof RECLAMO_ESTADOS];

export const RECLAMO_ESTADOS_LISTA: readonly EstadoReclamo[] = [
  RECLAMO_ESTADOS.RECIBIDOS,
  RECLAMO_ESTADOS.ASIGNADOS,
  RECLAMO_ESTADOS.FINALIZADO,
];

export const RECLAMO_ESTADO_ETIQUETAS: Record<EstadoReclamo, string> = {
  [RECLAMO_ESTADOS.RECIBIDOS]: 'Recibidos',
  [RECLAMO_ESTADOS.ASIGNADOS]: 'Asignados',
  [RECLAMO_ESTADOS.FINALIZADO]: 'Finalizado',
};
