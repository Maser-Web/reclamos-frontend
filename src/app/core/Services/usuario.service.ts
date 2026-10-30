import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { BACKEND_ENDPOINTS } from '../endpoints/backend.endpoints';
import { CrearUsuarioRequest, Usuario, UsuarioCreado } from '../interfaces/usuario.interface';

/** Mantiene el usuario autenticado y centraliza las operaciones de cuenta. */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  readonly actual = computed<Usuario | null>(() => {
    const usuCodigo = this.auth.usuarioCodigo();
    return usuCodigo === null
      ? null
      : { usuCodigo, usuNombre: null, usuLogin: null, usuPerfil: null };
  });

  crear(datos: CrearUsuarioRequest): Observable<UsuarioCreado> {
    return this.http.post<UsuarioCreado>(BACKEND_ENDPOINTS.usuario.base, {
      usuNombre: datos.usuNombre.trim(),
      usuContrasena: datos.usuContrasena,
      usuFecnac: datos.usuFecnac,
    });
  }
}
