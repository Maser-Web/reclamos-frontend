import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Cierre, Comentario, Derivacion, Reclamo, ReclamoFiltro, Seguimiento } from '../interfaces/models';

export interface ReclamosRepository {
  getAll(filtro?: ReclamoFiltro): Observable<Reclamo[]>;
  getById(id: string): Observable<Reclamo | undefined>;
  derive(id: string, derivacion: Derivacion): Observable<Reclamo>;
  addComment(id: string, comentario: Omit<Comentario, 'id' | 'reclamoId' | 'fecha'>): Observable<Comentario>;
  close(id: string, cierre: Cierre): Observable<Reclamo>;
  getTracking(id: string): Observable<Seguimiento[]>;
  getComments(id: string): Observable<Comentario[]>;
}
export const RECLAMOS_REPOSITORY = new InjectionToken<ReclamosRepository>('RECLAMOS_REPOSITORY');
