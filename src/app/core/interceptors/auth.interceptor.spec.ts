import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';
import { NotificationService } from '../Services/notification.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  const logout = jasmine.createSpy('logout');
  const navigate = jasmine.createSpy('navigate').and.resolveTo(true);
  const accessDenied = jasmine.createSpy('accessDenied').and.resolveTo(undefined);

  beforeEach(() => {
    logout.calls.reset();
    navigate.calls.reset();
    accessDenied.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { accessToken: signal('token-de-prueba'), logout } },
        { provide: Router, useValue: { url: '/reclamos/19', navigate } },
        { provide: NotificationService, useValue: { error: accessDenied } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('adds the bearer token to protected backend requests and preserves existing headers', () => {
    TestBed.inject(HttpClient).post('http://localhost:7500/reclamos', {}, {
      headers: { 'Content-Type': 'application/json' },
    }).subscribe();

    const request = http.expectOne('http://localhost:7500/reclamos');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    request.flush({});
  });

  it('does not add a bearer token to the login request', () => {
    TestBed.inject(HttpClient).post('http://localhost:7500/auth/login', {}).subscribe();

    const request = http.expectOne('http://localhost:7500/auth/login');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  it('logs out and returns to login after a protected request receives 401', () => {
    TestBed.inject(HttpClient).get('http://localhost:7500/reclamos').subscribe({ error: () => undefined });

    http.expectOne('http://localhost:7500/reclamos')
      .flush({ mensaje: 'Token vencido' }, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/reclamos/19' } });
  });

  it('shows an access-restricted message when the backend returns 403', () => {
    TestBed.inject(HttpClient).get('http://localhost:7500/reclamos').subscribe({ error: () => undefined });

    http.expectOne('http://localhost:7500/reclamos')
      .flush({ mensaje: 'Sin permisos' }, { status: 403, statusText: 'Forbidden' });

    expect(accessDenied).toHaveBeenCalledWith('Acceso restringido', 'No tenés permisos para realizar esta operación.');
  });
});
