import type { EstadoReclamo } from '../constants/reclamo-estados';
export type { EstadoReclamo } from '../constants/reclamo-estados';
export type PrioridadReclamo = 'baja' | 'media' | 'alta';
export type TipoComentario = 'interno' | 'cliente';

export interface Area { id: string; nombre: string; icono: string; }
export interface Usuario { id: string; nombre: string; email: string; areaId: string; }
export interface Cliente { id: string; nombre: string; cuit: string; email: string; telefono: string; }
export interface Archivo { id: string; nombre: string; tipo: string; tamano: string; }
export interface Comentario { id: string; reclamoId: string; tipo: TipoComentario; texto: string; autor: string; fecha: string; archivos: Archivo[]; }
export interface Seguimiento { id: string; reclamoId: string; titulo: string; detalle?: string; autor?: string; fecha: string; hora?: string; tipo: 'creado' | 'asignado' | 'gestion' | 'comentario' | 'cerrado'; }
export interface Reclamo { id: string; numero: string; asunto: string; descripcion: string; estado: EstadoReclamo; prioridad: PrioridadReclamo; clienteId: string; areaId: string | null; responsableId: string | null; responsableNombre: string | null; fechaCreacion: string; fechaActualizacion: string; archivos: Archivo[]; }
export interface ReclamoFiltro { estados?: EstadoReclamo[]; areaIds?: string[]; desde?: string; hasta?: string; busqueda?: string; }
export interface Derivacion { areaId: string; responsableId: string; comentario?: string; }
export interface Cierre { motivo: string; comentario?: string; notificarCliente: boolean; }

/**
 * Presentation model used by the existing mobile UI. It is built from
 * ReclamoBackend in ReclamosService; it is not a second backend contract.
 */
export interface ReclamoVista {
  id: string;
  numero: string;
  asunto: string;
  descripcion: string;
  estado: EstadoReclamo;
  prioridad: PrioridadReclamo;
  clienteId: string;
  areaId: string | null;
  responsableId: string | null;
  responsableNombre: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  archivos: Archivo[];
}
