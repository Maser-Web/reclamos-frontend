/** Usuario que puede ser seleccionado como cliente al crear un reclamo. */
export interface Cliente {
  usuCodigo: number;
  usuNombre: string | null;
  usuLogin?: string | null;
}
