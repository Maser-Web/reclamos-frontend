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
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), { provide: AuthService, useValue: { accessToken: signal('token-de-prueba'), usuarioCodigo: signal(42) } }, { provide: Router, useValue: { url: '/reclamos', navigate: () => Promise.resolve(true) } }, { provide: NotificationService, useValue: { error: () => Promise.resolve() } }] });
    service = TestBed.inject(ReclamosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the first page and maps the backend contract to the UI model', () => {
    service.list({ limit: '10', offset: '0' }).subscribe(reclamos => {
      expect(reclamos).toEqual([jasmine.objectContaining({
        id: '123', clienteId: 'Cliente de prueba', serDescri: 'Servicio 2', responsableNombre: 'Supervisor de prueba', estado: RECLAMO_ESTADOS.RECIBIDOS, prioridad: 'alta',
      })]);
    });

    const request = http.expectOne(request => request.url === 'http://localhost:7500/reclamos');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('limit')).toBe('10');
    expect(request.request.params.get('offset')).toBe('0');
    request.flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: [reclamoBackend] });
  });

  it('requests the global paginated claims page for management profiles', () => {
    service.listarTodos({ limit: '10', offset: '20' }).subscribe(page => {
      expect(page.items).toEqual([jasmine.objectContaining({ id: '123' })]);
      expect(page).toEqual(jasmine.objectContaining({ limit: 10, offset: 20, total: 31, hasNext: true }));
    });

    const request = http.expectOne(request => request.url === 'http://localhost:7500/reclamos');
    expect(request.request.params.get('limit')).toBe('10');
    expect(request.request.params.get('offset')).toBe('20');
    request.flush({ codigo: 200, mensaje: 'OK', data: { items: [reclamoBackend], limit: 10, offset: 20, total: 31, hasNext: true } });
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

  it('requests the claims assigned to a user', () => {
    service.byUsuario('42').subscribe(reclamos => {
      expect(reclamos).toEqual([jasmine.objectContaining({ id: '123' })]);
    });

    const request = http.expectOne('http://localhost:7500/reclamos/usuario/42');
    expect(request.request.method).toBe('GET');
    request.flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: [reclamoBackend] });
  });

  it('requests an authenticated paginated claim page with a bearer token', () => {
    service.misReclamos({ limit: '10', offset: '20' }).subscribe(page => {
      expect(page.items).toEqual([jasmine.objectContaining({ id: '123' })]);
      expect(page).toEqual(jasmine.objectContaining({ limit: 10, offset: 20, total: 31, hasNext: true }));
    });

    const request = http.expectOne(request => request.url === 'http://localhost:7500/reclamos/mis-reclamos');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    expect(request.request.params.get('limit')).toBe('10');
    expect(request.request.params.get('offset')).toBe('20');
    request.flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: { items: [reclamoBackend], limit: 10, offset: 20, total: 31, hasNext: true } });
  });

  it('adapts the previous array response while the paginated endpoint is deployed', () => {
    service.misReclamos({ limit: '1', offset: '1' }).subscribe(page => {
      expect(page.total).toBe(2);
      expect(page.hasNext).toBeFalse();
      expect(page.items).toEqual([jasmine.objectContaining({ id: '124' })]);
    });

    const request = http.expectOne(request => request.url === 'http://localhost:7500/reclamos/mis-reclamos');
    request.flush({ codigo: 200, mensaje: 'OK', data: [reclamoBackend, { ...reclamoBackend, recCodigo: '124' }] });
  });

  it('does not fall back to another user-scoped endpoint when mis-reclamos fails', () => {
    service.misReclamos({ limit: '10', offset: '0' }).subscribe({
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
