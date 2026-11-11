import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthToken } from '../interfaces/auth.interface';
import { AuthService } from './auth.service';
import { AvisosService } from './avisos.service';

type AuthInternals = { session: WritableSignal<AuthToken | null> };

describe('AvisosService', () => {
  let service: AvisosService;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AvisosService);
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('comparte la consulta vigente, reutiliza la caché y la aísla por usuario', () => {
    setSession(auth, 7);
    service.consultarAvisos().subscribe();
    service.consultarAvisos().subscribe();
    const first = http.expectOne('http://localhost:7500/avisos/7');
    first.flush({ codigo: 200, mensaje: 'OK', data: [] });

    service.consultarAvisos().subscribe();
    http.expectNone('http://localhost:7500/avisos/7');

    setSession(auth, 8);
    service.consultarAvisos().subscribe();
    const second = http.expectOne('http://localhost:7500/avisos/8');
    second.flush({ codigo: 200, mensaje: 'OK', data: [] });
    expect(true).toBeTrue();
  });
});

function setSession(auth: AuthService, usuarioId: number): void {
  (auth as unknown as AuthInternals).session.set({
    accessToken: 'token',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    sessionId: `session-${usuarioId}`,
    usuarioId,
    usuNombre: null,
  });
}
