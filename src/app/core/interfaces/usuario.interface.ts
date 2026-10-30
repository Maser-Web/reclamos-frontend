export interface Usuario {
  usuCodigo: number;
  usuNombre: string | null;
  usuLogin: string | null;
  usuPerfil: number | null;
}

/** Datos necesarios para crear una cuenta desde la pantalla de registro. */
export interface CrearUsuarioRequest {
  usuNombre: string;
  usuContrasena: string;
  usuFecnac: string;
}

export interface UsuarioCreado {
  id?: number;
  nombre?: string | null;
  email?: string | null;
  usuario?: string | null;
}
