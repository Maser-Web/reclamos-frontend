import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Usuario } from '../interfaces/usuario.interface';

/**
 * The backend does not expose user endpoints yet. This service only exposes
 * the authenticated user's identifier returned by POST /auth/login.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly auth = inject(AuthService);

  readonly actual = computed<Usuario | null>(() => {
    const usuCodigo = this.auth.usuarioCodigo();
    return usuCodigo === null
      ? null
      : { usuCodigo, usuNombre: null, usuLogin: null, usuPerfil: null };
  });
}
