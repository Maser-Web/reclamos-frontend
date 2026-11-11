import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MotivosReclamosService } from './motivos-reclamos.service';

describe('MotivosReclamosService', () => {
  let service: MotivosReclamosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(MotivosReclamosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene sólo los motivos de apertura desde su endpoint', () => {
    service.apertura().subscribe(motivos => expect(motivos).toEqual([{ mtrCodigo: 1, mtrDescri: 'Sin servicio', mtrTipo: 1 }]));
    const request = http.expectOne('http://localhost:7500/motivos-reclamos/apertura');
    expect(request.request.method).toBe('GET');
    request.flush({ codigo: 200, mensaje: 'OK', data: [{ mtrCodigo: 1, mtrDescri: 'Sin servicio', mtrTipo: 1 }, { mtrCodigo: 2, mtrDescri: 'No usar', mtrTipo: 2 }] });
  });

  it('obtiene sólo los motivos de clausura desde su endpoint', () => {
    service.clausura().subscribe(motivos => expect(motivos).toEqual([{ mtrCodigo: 3, mtrDescri: 'Resuelto', mtrTipo: 2 }]));
    const request = http.expectOne('http://localhost:7500/motivos-reclamos/clausura');
    expect(request.request.method).toBe('GET');
    request.flush({ codigo: 200, mensaje: 'OK', data: [{ mtrCodigo: 3, mtrDescri: 'Resuelto', mtrTipo: 2 }, { mtrCodigo: 4, mtrDescri: 'No usar', mtrTipo: 1 }] });
  });

  it('reutiliza en memoria cada catálogo de motivos', () => {
    service.apertura().subscribe();
    service.apertura().subscribe();
    const request = http.expectOne('http://localhost:7500/motivos-reclamos/apertura');
    request.flush({ codigo: 200, mensaje: 'OK', data: [] });

    service.apertura().subscribe();
    http.expectNone('http://localhost:7500/motivos-reclamos/apertura');
    expect(true).toBeTrue();
  });
});
