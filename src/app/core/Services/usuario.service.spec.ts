import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene los usuarios disponibles para adherir desde el backend', () => {
    service.listar().subscribe(usuarios => {
      expect(usuarios).toEqual([
        { usuCodigo: 19, usuNombre: 'María González', usuLogin: 'mgonzalez', usuPerfil: 2 },
      ]);
    });

    const request = http.expectOne('http://localhost:7500/usuarios');
    expect(request.request.method).toBe('GET');
    request.flush({
      codigo: 200,
      mensaje: 'OK',
      data: [{ usuCodigo: 19, usuNombre: 'María González', usuLogin: 'mgonzalez', usuPerfil: 2 }],
    });
  });
});
