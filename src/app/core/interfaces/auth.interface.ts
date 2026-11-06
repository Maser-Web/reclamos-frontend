export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface AuthToken {
  accessToken: string;
  expiresAt: string;
  sessionId: string;
  usuarioId: number;
  usuNombre: string | null;
  usuPerfil?: number | string | null;
  usu_perfil?: number | string | null;
}

