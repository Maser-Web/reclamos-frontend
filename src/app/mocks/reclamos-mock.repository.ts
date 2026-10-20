import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Cierre, Comentario, Derivacion, Reclamo, ReclamoFiltro, Seguimiento } from '../core/interfaces/models';
import { ReclamosRepository } from '../core/data/reclamos.repository';
import { COMENTARIOS_MOCK, RECLAMOS_MOCK, SEGUIMIENTOS_MOCK } from './reclamos.mock';
import { AREAS_MOCK, CLIENTES_MOCK, USUARIOS_MOCK } from './catalogos.mock';

@Injectable({ providedIn: 'root' })
export class ReclamosMockRepository implements ReclamosRepository {
  private reclamos = structuredClone(RECLAMOS_MOCK);
  private seguimientos = structuredClone(SEGUIMIENTOS_MOCK);
  private comentarios = structuredClone(COMENTARIOS_MOCK);
  getAll(filtro: ReclamoFiltro = {}): Observable<Reclamo[]> {
    const needle = filtro.busqueda?.trim().toLowerCase();
    return of(this.reclamos.filter(r => {
      const cliente = CLIENTES_MOCK.find(c => c.id === r.clienteId)?.nombre ?? '';
      return (!filtro.estados?.length || filtro.estados.includes(r.estado)) && (!filtro.areaIds?.length || (!!r.areaId && filtro.areaIds.includes(r.areaId))) &&
        (!filtro.desde || r.fechaCreacion >= filtro.desde) && (!filtro.hasta || r.fechaCreacion <= `${filtro.hasta}T23:59:59`) &&
        (!needle || [r.numero, r.asunto, cliente].join(' ').toLowerCase().includes(needle));
    }).map(r => structuredClone(r)));
  }
  getById(id: string): Observable<Reclamo | undefined> { return of(this.reclamos.find(r => r.id === id)).pipe(); }
  derive(id: string, value: Derivacion): Observable<Reclamo> {
    const reclamo = this.find(id); const area = AREAS_MOCK.find(a => a.id === value.areaId); const user = USUARIOS_MOCK.find(u => u.id === value.responsableId);
    reclamo.areaId = value.areaId; reclamo.responsableId = value.responsableId; reclamo.estado = 'en-gestion'; reclamo.fechaActualizacion = this.now();
    this.seguimientos.push({ id: crypto.randomUUID(), reclamoId: id, titulo: `Asignado a ${area?.nombre ?? 'área'}`, detalle: value.comentario, autor: user?.nombre, fecha: reclamo.fechaActualizacion, tipo: 'asignado' });
    return of(structuredClone(reclamo));
  }
  addComment(id: string, value: Omit<Comentario, 'id' | 'reclamoId' | 'fecha'>): Observable<Comentario> {
    this.find(id); const comment: Comentario = { ...value, id: crypto.randomUUID(), reclamoId: id, fecha: this.now() }; this.comentarios.push(comment);
    this.seguimientos.push({ id: crypto.randomUUID(), reclamoId: id, titulo: value.tipo === 'interno' ? 'Comentario interno' : 'Respuesta al cliente', detalle: value.texto, autor: value.autor, fecha: comment.fecha, tipo: 'comentario' });
    return of(structuredClone(comment));
  }
  close(id: string, cierre: Cierre): Observable<Reclamo> {
    const reclamo = this.find(id); reclamo.estado = 'cerrado'; reclamo.fechaActualizacion = this.now();
    this.seguimientos.push({ id: crypto.randomUUID(), reclamoId: id, titulo: `Reclamo cerrado: ${cierre.motivo}`, detalle: cierre.comentario, autor: 'María González', fecha: reclamo.fechaActualizacion, tipo: 'cerrado' });
    return of(structuredClone(reclamo));
  }
  getTracking(id: string): Observable<Seguimiento[]> { return of(this.seguimientos.filter(s => s.reclamoId === id).map(s => structuredClone(s))); }
  getComments(id: string): Observable<Comentario[]> { return of(this.comentarios.filter(c => c.reclamoId === id).map(c => structuredClone(c))); }
  private find(id: string): Reclamo { const item = this.reclamos.find(r => r.id === id); if (!item) throw new Error(`Reclamo ${id} no encontrado`); return item; }
  private now(): string { return new Date().toISOString(); }
}
