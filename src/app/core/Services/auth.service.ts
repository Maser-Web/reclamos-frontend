import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { map, Observable, tap, throwError } from 'rxjs';
import { BACKEND_ENDPOINTS } from '../endpoints/backend.endpoints';
import { ApiResponse } from '../interfaces/api-response.interface';
import { AuthToken, LoginRequest } from '../interfaces/auth.interface';

const SESSION_STORAGE_KEY = 'coronel-reclamos.auth-session';

const ROL_STORAGE_KEY = 'rol';
const ROLES_GESTION_RECLAMOS: readonly number[] = [1, 2, 3];

type StoredSession = AuthToken;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<StoredSession | null>(this.readStoredSession());
  readonly isAuthenticated = computed(() => this.session() !== null && !this.isExpired(this.session()!.expiresAt));
  readonly accessToken = computed(() => this.session()?.accessToken ?? null);
  readonly usuarioId = computed(() => this.session()?.usuarioId ?? null);
  readonly usuarioCodigo = computed(() => this.session()?.usuarioId ?? null);
  readonly usuarioNombre = computed(() => this.session()?.usuNombre?.trim() || null);
  readonly usuarioPerfil = computed<number | null>(() => {
    const perfil = this.session()?.usuPerfil ?? this.session()?.usu_perfil;
    const value = Number(perfil);
    return Number.isInteger(value) ? value : null;
  });
  readonly puedeGestionarReclamos = computed(() => ROLES_GESTION_RECLAMOS.includes(this.usuarioPerfil() ?? 0));
  readonly esOperador = computed(() => this.usuarioPerfil() === 4);

  login(credentials: LoginRequest): Observable<AuthToken> {
    const validationError = this.validateCredentials(credentials);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const payload: LoginRequest = { usuario: credentials.usuario.trim(), password: credentials.password };
    return this.http.post<ApiResponse<AuthToken>>(BACKEND_ENDPOINTS.auth.login, payload).pipe(
      map(response => this.unwrap(response)),
      tap(token => {
        this.persistSession(token);
        this.persistRol(token.usuPerfil ?? token.usu_perfil);
      }),
    );
  }

  renewSession(): Observable<AuthToken> {
    const session = this.session();
    if (!session) return throwError(() => new Error('No hay una sesión activa'));

    return this.http.put<ApiResponse<AuthToken>>(BACKEND_ENDPOINTS.auth.session(session.sessionId), undefined).pipe(
      map(response => this.unwrap(response)),
      tap(token => this.persistSession({
        ...token,
        usuarioId: session.usuarioId,
        usuNombre: token.usuNombre?.trim() || session.usuNombre,
      })),
    );
  }

  logout(): void {
    this.session.set(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(ROL_STORAGE_KEY);
  }

  /** Roles (usu_perfil) autorizados a adherir clientes a un reclamo. */
  puedeAdherirReclamo(): boolean {
    return this.puedeGestionarReclamos();
  }

  private persistRol(perfil: number | string | null | undefined): void {
    if (perfil === null || perfil === undefined) {
      localStorage.removeItem(ROL_STORAGE_KEY);
      return;
    }
    localStorage.setItem(ROL_STORAGE_KEY, String(perfil));
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (response.data === null) throw new Error(response.mensaje);
    return response.data;
  }

  private validateCredentials(credentials: LoginRequest): string | null {
    if (!credentials.usuario.trim()) return 'El usuario es obligatorio';
    if (!credentials.password) return 'La contraseña es obligatoria';
    if (credentials.usuario.trim().length > 10 || credentials.password.length > 20) {
      return 'Las credenciales superan la longitud permitida';
    }
    return null;
  }

  private persistSession(session: StoredSession): void {
    this.session.set(session);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  private readStoredSession(): StoredSession | null {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;
      const session = JSON.parse(stored) as StoredSession;
      return typeof session.accessToken === 'string' && typeof session.sessionId === 'string' &&
        typeof session.expiresAt === 'string' && !this.isExpired(session.expiresAt) ? session : null;
    } catch {
      return null;
    }
  }

  private isExpired(expiresAt: string): boolean {
    return Number.isNaN(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now();
  }
}
