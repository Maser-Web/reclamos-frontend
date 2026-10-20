import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Area, Cliente, Usuario } from '../interfaces/models';
import { AREAS_MOCK, CLIENTES_MOCK, USUARIOS_MOCK } from '../../mocks/catalogos.mock';
@Injectable({ providedIn: 'root' })
export class AreasService { list(): Observable<Area[]> { return of(AREAS_MOCK); } }
@Injectable({ providedIn: 'root' })
export class UsuariosService { byArea(areaId: string): Observable<Usuario[]> { return of(USUARIOS_MOCK.filter(u => u.areaId === areaId)); } current(): Usuario { return USUARIOS_MOCK[0]; } }
@Injectable({ providedIn: 'root' })
export class ClientesService { get(id: string): Cliente | undefined { return CLIENTES_MOCK.find(c => c.id === id); } }
