import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RECLAMOS_REPOSITORY } from '../data/reclamos.repository';
import { Cierre, Comentario, Derivacion, Reclamo, ReclamoFiltro, Seguimiento } from '../interfaces/models';
@Injectable({ providedIn: 'root' })
export class ReclamosService {
  private readonly repository = inject(RECLAMOS_REPOSITORY);
  list(filtro?: ReclamoFiltro): Observable<Reclamo[]> { return this.repository.getAll(filtro); }
  detail(id: string): Observable<Reclamo | undefined> { return this.repository.getById(id); }
  derive(id: string, value: Derivacion): Observable<Reclamo> { return this.repository.derive(id, value); }
  comment(id: string, value: Omit<Comentario, 'id' | 'reclamoId' | 'fecha'>): Observable<Comentario> { return this.repository.addComment(id, value); }
  close(id: string, value: Cierre): Observable<Reclamo> { return this.repository.close(id, value); }
  tracking(id: string): Observable<Seguimiento[]> { return this.repository.getTracking(id); }
  comments(id: string): Observable<Comentario[]> { return this.repository.getComments(id); }
}
