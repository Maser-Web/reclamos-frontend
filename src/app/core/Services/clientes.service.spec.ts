import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ClientesService } from './clientes.service';

describe('ClientesService', () => {
  let service: ClientesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ClientesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches clients with encoded, paginated query parameters', () => {
    service.buscar('Martín Pérez', 20, 0).subscribe(response => expect(response.data?.[0].cliNombre).toBe('Martín Pérez'));

    const request = http.expectOne('http://localhost:7500/clientes/buscar?q=Mart%C3%ADn%20P%C3%A9rez&limit=20&offset=0');
    expect(request.request.method).toBe('GET');
    request.flush({ codigo: 200, mensaje: 'OK', data: [{ cliCodigo: 19, cliNombre: 'Martín Pérez' }] });
  });

  it('searches an exact numeric client code', () => {
    service.buscar('19', 20, 40).subscribe(response => expect(response.data?.[0].cliCodigo).toBe(19));

    const request = http.expectOne('http://localhost:7500/clientes/buscar?q=19&limit=20&offset=40');
    expect(request.request.method).toBe('GET');
    request.flush({ codigo: 200, mensaje: 'OK', data: [{ cliCodigo: 19, cliNombre: 'Cliente de prueba' }] });
  });

  it('rejects an invalid search before creating a request', () => {
    expect(() => service.buscar('a')).toThrowError('La búsqueda por nombre requiere al menos 2 caracteres');
  });
});
