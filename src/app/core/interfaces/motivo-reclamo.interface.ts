/** Motivo configurable para la apertura o clausura de reclamos. */
export interface MotivoReclamo {
  mtrCodigo: number;
  mtrDescri: string;
  mtrTipo: 1 | 2;
}
