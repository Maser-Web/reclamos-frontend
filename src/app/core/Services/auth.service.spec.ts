import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { NotificationService } from './notification.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), { provide: Router, useValue: { url: '/login', navigate: () => Promise.resolve(true) } }, { provide: NotificationService, useValue: { error: () => Promise.resolve() } }] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('logs in and persists the user code returned by the backend', () => {
    service.login({ usuario: 'maria', password: 'secreta' }).subscribe(token => {
      expect(token.sessionId).toBe('23');
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.usuarioCodigo()).toBe(42);
      expect(service.usuarioNombre()).toBe('María González');
    });

    const login = http.expectOne('http://localhost:7500/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.headers.has('Authorization')).toBeFalse();
    expect(login.request.body).toEqual({ usuario: 'maria', password: 'secreta' });
    login.flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: {
      accessToken: 'token', expiresAt: '2030-01-01T00:00:00.000Z', sessionId: '23', usuarioId: 42, usuNombre: 'María González',
    } });
    http.expectNone(request => request.method === 'GET' && request.url === 'http://localhost:7500/auth/23');
  });

  it('uses usuAdminReclamo, independently of usuPerfil, to authorize claim management', () => {
    service.login({ usuario: 'maria', password: 'secreta' }).subscribe();
    http.expectOne('http://localhost:7500/auth/login').flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: {
      accessToken: 'token', expiresAt: '2030-01-01T00:00:00.000Z', sessionId: '23', usuarioId: 42, usuNombre: 'María González', usuPerfil: 4, usuAdminReclamo: 1,
    } });

    expect(service.usuAdminReclamo()).toBe(1);
    expect(service.esAdministradorReclamos()).toBeTrue();
    expect(service.puedeGestionarReclamos()).toBeTrue();
    expect(service.esOperador()).toBeFalse();
    service.logout();
    expect(localStorage.getItem('coronel-reclamos.auth-session')).toBeNull();
  });

  it('treats any usuAdminReclamo value other than 1 as operator', () => {
    service.login({ usuario: 'maria', password: 'secreta' }).subscribe();
    http.expectOne('http://localhost:7500/auth/login').flush({ codigo: 200, mensaje: 'OK', data: {
      accessToken: 'token', expiresAt: '2030-01-01T00:00:00.000Z', sessionId: '23', usuarioId: 42, usuNombre: 'María González', usuPerfil: 1, usuAdminReclamo: 0,
    } });

    expect(service.esAdministradorReclamos()).toBeFalse();
    expect(service.esOperador()).toBeTrue();
    expect(service.puedeGestionarReclamos()).toBeFalse();
  });

  it('renews the session without replacing the authenticated user or name', () => {
    service.login({ usuario: 'maria', password: 'secreta' }).subscribe();
    http.expectOne('http://localhost:7500/auth/login').flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: {
      accessToken: 'token', expiresAt: '2030-01-01T00:00:00.000Z', sessionId: '23', usuarioId: 42, usuNombre: 'María González', usuAdminReclamo: 1,
    } });

    service.renewSession().subscribe(token => {
      expect(token.accessToken).toBe('renewed-token');
      expect(service.usuarioCodigo()).toBe(42);
      expect(service.usuarioNombre()).toBe('María González');
      expect(service.esAdministradorReclamos()).toBeTrue();
    });

    const renew = http.expectOne('http://localhost:7500/auth/23');
    expect(renew.request.method).toBe('PUT');
    expect(renew.request.headers.get('Authorization')).toBe('Bearer token');
    renew.flush({ codigo: 200, mensaje: 'Operacion realizada correctamente', data: {
      accessToken: 'renewed-token', expiresAt: '2030-01-02T00:00:00.000Z', sessionId: '23', usuarioId: 999,
    } });
  });
});
