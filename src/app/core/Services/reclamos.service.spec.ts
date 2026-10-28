import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReclamoBackend } from '../interfaces/reclamo.interface';
import { RECLAMO_ESTADOS } from '../constants/reclamo-estados';
import { ReclamosService } from './reclamos.service';

const reclamoBackend: ReclamoBackend = {
  recCodigo: '123', recFecha: '2026-10-01T10:00:00.000Z', recHora: null,
  recMotivo: 'Factura incorrecta', recTcid: '55', recServicio: null, recRecibio: null,
  recSucursal: null, recFecalta: null, recHoraalta: null, recPlamov: null,
  recEstado: 'RECIBIDO', recDerivo: '42', recFechaD: null, recHoraD: null,
  recFechaF: null, recHoraF: null, recUsuarioF: null, recEstadoMsg: null,
  recEnviado: null, recTipo: null, recComentarioF: null, recPrioridad: 'alta',
};

describe('ReclamosService', () => {
  let service: ReclamosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReclamosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the first page and maps the backend contract to the UI model', () => {
    service.list({ limit: '10', offset: '0' }).subscribe(reclamos => {
      expect(reclamos).toEqual([jasmine.objectContaining({ id: '123', estado: RECLAMO_ESTADOS.RECIBIDOS, prioridad: 'alta' })]);
    });

    const request = http.expectOne(request => request.url === 'http://localhost:7500/reclamos');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('limit')).toBe('10');
    expect(request.request.params.get('offset')).toBe('0');
    request.flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: [reclamoBackend] });
  });

  it('sends FINALIZADO and the user code in the state update request', () => {
    service.actualizarEstado('123', RECLAMO_ESTADOS.FINALIZADO, { usuCodigo: '42', comentario: 'Resuelto' }).subscribe();

    const request = http.expectOne('http://localhost:7500/reclamos/123/estado/FINALIZADO');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ usuCodigo: '42', comentario: 'Resuelto' });
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
