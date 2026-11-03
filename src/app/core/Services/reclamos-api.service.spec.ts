import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CrearReclamoPayload } from '../interfaces/reclamo.interface';
import { ReclamosApiService } from './reclamos-api.service';

describe('ReclamosApiService', () => {
  let service: ReclamosApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReclamosApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('creates a claim with only the documented JSON payload and unwraps data', () => {
    const payload: CrearReclamoPayload = { motivo: 'Sin suministro eléctrico', usu_codigo: 7, servicio: 2 };
    service.crearReclamo(payload).subscribe(reclamo => expect(reclamo?.recCodigo).toBe('99'));
    const request = http.expectOne('http://localhost:7500/reclamos');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    expect(request.request.body).toEqual(payload);
    request.flush({ codigo: 201, mensaje: 'Creado', data: { recCodigo: '99' } });
  });

  it('gets the services list and a service detail as response data', () => {
    service.obtenerServicios().subscribe(services => expect(services?.[0].serCodigo).toBe('2'));
    const list = http.expectOne('http://localhost:7500/servicios');
    expect(list.request.method).toBe('GET');
    expect(list.request.headers.get('Content-Type')).toBe('application/json');
    list.flush({ codigo: 200, mensaje: 'OK', data: [{ serCodigo: '2', serDescri: 'Energía' }] });

    service.obtenerServicioPorId(2).subscribe(service => expect(service?.serDescri).toBe('Energía'));
    const detail = http.expectOne('http://localhost:7500/servicios/2');
    expect(detail.request.method).toBe('GET');
    detail.flush({ codigo: 200, mensaje: 'OK', data: { serCodigo: '2', serDescri: 'Energía' } });
  });

  it('rejects an invalid service id before creating a request', () => {
    expect(() => service.obtenerServicioPorId(0)).toThrowError('El id del servicio debe ser un entero positivo');
  });
});
