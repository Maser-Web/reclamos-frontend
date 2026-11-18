import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReclamoBackend } from '../interfaces/reclamo.interface';
import { RECLAMO_ESTADOS } from '../constants/reclamo-estados';
import { ReclamosService } from './reclamos.service';
import { AuthService } from './auth.service';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { NotificationService } from './notification.service';

const reclamoBackend: ReclamoBackend = {
  recCodigo: '123', recFecha: '2026-10-01T10:00:00.000Z', recHora: null,
  recMotivo: 'Factura incorrecta', recTcid: '55', cliNombre: 'Cliente de prueba', recServicio: 2, recRecibio: null,
  recSucursal: null, recFecalta: null, recHoraalta: null, recPlamov: null,
  recEstado: 'RECIBIDO', recDerivo: '42', usuNombreDerivado: 'Supervisor de prueba', recFechaD: null, recHoraD: null,
  recFechaF: null, recHoraF: null, recUsuarioF: null, recEstadoMsg: null,
  recEnviado: null, recTipo: null, recComentarioF: null, recPrioridad: 'alta',
};

describe('ReclamosService', () => {
  let service: ReclamosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), { provide: AuthService, useValue: { accessToken: signal('token-de-prueba'), usuarioCodigo: signal(42), usuarioId: signal(42), esOperador: signal(false) } }, { provide: Router, useValue: { url: '/reclamos', navigate: () => Promise.resolve(true) } }, { provide: NotificationService, useValue: { error: () => Promise.resolve() } }] });
    service = TestBed.inject(ReclamosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const ok = (data: ReclamoBackend[], hasNext: boolean) => ({ codigo: 200, mensaje: 'Operacion realizada correctamente', data, hasNext });

  it('requests the first admin page without estado and maps the backend contract to the UI model', () => {
    service.pagina({ rol: 'admin', estado: null, limit: 10, offset: 0 }).subscribe(page => {
      expect(page.items).toEqual([jasmine.objectContaining({
        id: '123', clienteId: 'Cliente de prueba', serDescri: 'Servicio 2', responsableNombre: 'Supervisor de prueba', estado: RECLAMO_ESTADOS.RECIBIDOS, prioridad: 'alta',
      })]);
      expect(page).toEqual(jasmine.objectContaining({ limit: 10, offset: 0, hasNext: true }));
    });

    const request = http.expectOne('http://localhost:7500/reclamos?limit=10&offset=0');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    request.flush(ok([reclamoBackend], true));
  });

  it('encodes EN CURSO as %20 and uses mis-reclamos for operators', () => {
    service.pagina({ rol: 'operador', estado: 'EN CURSO', limit: 10, offset: 20 }).subscribe(page => {
      expect(page.hasNext).toBeFalse();
    });

    const request = http.expectOne('http://localhost:7500/reclamos/mis-reclamos?estado=EN%20CURSO&limit=10&offset=20');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    request.flush(ok([reclamoBackend], false));
  });

  it('maps the UI states to the backend estado filter', () => {
    expect(service.estadoFiltro(null)).toBeNull();
    expect(service.estadoFiltro(RECLAMO_ESTADOS.RECIBIDOS)).toBe('RECIBIDO');
    expect(service.estadoFiltro(RECLAMO_ESTADOS.EN_CURSO)).toBe('EN CURSO');
    expect(service.estadoFiltro(RECLAMO_ESTADOS.FINALIZADO)).toBe('FINALIZADO');
  });

  it('reuses a cached page for the same key and requests other offsets directly', () => {
    const request = { rol: 'admin' as const, estado: 'RECIBIDO' as const, limit: 10, offset: 0 };
    service.pagina(request).subscribe();
    http.expectOne('http://localhost:7500/reclamos?estado=RECIBIDO&limit=10&offset=0').flush(ok([reclamoBackend], true));

    let cachedItems = 0;
    service.pagina(request).subscribe(page => cachedItems = page.items.length);
    http.expectNone(() => true);
    expect(cachedItems).toBe(1);

    service.pagina({ ...request, offset: 50 }).subscribe();
    http.expectOne('http://localhost:7500/reclamos?estado=RECIBIDO&limit=10&offset=50').flush(ok([], false));
  });

  it('invalidates cached pages after a state change', () => {
    const request = { rol: 'admin' as const, estado: null, limit: 10, offset: 0 };
    service.pagina(request).subscribe();
    http.expectOne('http://localhost:7500/reclamos?limit=10&offset=0').flush(ok([reclamoBackend], false));

    service.actualizarEstado('123', RECLAMO_ESTADOS.FINALIZADO, {}).subscribe();
    http.expectOne('http://localhost:7500/reclamos/123/estado/FINALIZADO').flush({ codigo: 200, mensaje: 'OK', data: null });

    service.pagina(request).subscribe();
    http.expectOne('http://localhost:7500/reclamos?limit=10&offset=0').flush(ok([], false));
  });

  it('updates the priority inside cached pages', () => {
    const request = { rol: 'admin' as const, estado: null, limit: 10, offset: 0 };
    service.pagina(request).subscribe();
    http.expectOne('http://localhost:7500/reclamos?limit=10&offset=0').flush(ok([reclamoBackend], false));

    service.asignarPrioridad('123', 'baja').subscribe();
    http.expectOne('http://localhost:7500/reclamos/123/prioridad').flush({ codigo: 200, mensaje: 'OK', data: null });

    service.pagina(request).subscribe(page => expect(page.items[0].prioridad).toBe('baja'));
  });

  it('sends a bearer token when requesting a claim detail', () => {
    service.detail('19').subscribe(reclamo => expect(reclamo.id).toBe('123'));

    const request = http.expectOne('http://localhost:7500/reclamos/19');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    request.flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: reclamoBackend });
  });

  it('sends FINALIZADO and only the optional comment in the state update request', () => {
    service.actualizarEstado('123', RECLAMO_ESTADOS.FINALIZADO, { comentario: 'Resuelto' }).subscribe();

    const request = http.expectOne('http://localhost:7500/reclamos/123/estado/FINALIZADO');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ comentario: 'Resuelto' });
    request.flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: null });
  });

  it('sends the selected priority in uppercase', () => {
    service.asignarPrioridad('123', 'alta').subscribe();

    const request = http.expectOne('http://localhost:7500/reclamos/123/prioridad');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ prioridad: 'ALTA' });
    request.flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: null });
  });

  it('derives a claim by sending the selected user code', () => {
    service.derivar('123', 42).subscribe();

    const request = http.expectOne('http://localhost:7500/reclamos/123/derivar');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ usuCodigo: 42 });
    request.flush({ codigo: 200, mensaje: 'OK', data: null });
  });

  it('requests the claims assigned to a user', () => {
    service.byUsuario('42').subscribe(reclamos => {
      expect(reclamos).toEqual([jasmine.objectContaining({ id: '123' })]);
    });

    const request = http.expectOne('http://localhost:7500/reclamos/usuario/42');
    expect(request.request.method).toBe('GET');
    request.flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: [reclamoBackend] });
  });

  it('does not fall back to another user-scoped endpoint when mis-reclamos fails', () => {
    service.pagina({ rol: 'operador', estado: null, limit: 10, offset: 0 }).subscribe({
      error: error => expect(error.status).toBe(400),
    });

    http.expectOne('http://localhost:7500/reclamos/mis-reclamos?limit=10&offset=0')
      .flush({ codigo: 400, mensaje: 'Solicitud inválida', data: null }, { status: 400, statusText: 'Bad Request' });
    http.expectNone('http://localhost:7500/reclamos/usuario/42');
  });

  it('requests a claim history by claim code', () => {
    service.historial('123').subscribe(historial => {
      expect(historial).toEqual([jasmine.objectContaining({ reclamoId: '123', tipo: 'cerrado', hora: '11:40:48' })]);
    });

    const request = http.expectOne('http://localhost:7500/reclamos/123/historial');
    expect(request.request.method).toBe('GET');
    request.flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: [{
      hisCodigo: 1, hisEstadoAnterior: 'RECIBIDO', hisEstadoNuevo: 'FINALIZADO',
      hisFechaCambio: '2026-10-26T14:40:48.000Z', hisHoraCambio: '11:40:48',
      hisCodigoReclamo: 123, hisUsuarioCambio: 1,
    }] });
  });
});
