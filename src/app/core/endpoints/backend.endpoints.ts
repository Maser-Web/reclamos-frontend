import { API_BASE_URL } from '../../environments/environment';

const baseUrl = API_BASE_URL.replace(/\/$/, '');

export const BACKEND_ENDPOINTS = {
  health: `${baseUrl}/`,
  auth: {
    login: `${baseUrl}/auth/login`,
    session: (sessionId: string) => `${baseUrl}/auth/${encodeURIComponent(sessionId)}`,
  },
  usuario: {
    base: `${baseUrl}/usuarios`,
  },
  clientes: {
    buscar: `${baseUrl}/clientes/buscar`,
  },
  motivosReclamos: {
    apertura: `${baseUrl}/motivos-reclamos/apertura`,
    clausura: `${baseUrl}/motivos-reclamos/clausura`,
  },
  reclamos: {
    base: `${baseUrl}/reclamos`,
    byId: (id: string) => `${baseUrl}/reclamos/${encodeURIComponent(id)}`,
    byUsuario: (usuCodigo: string) =>
      `${baseUrl}/reclamos/usuario/${encodeURIComponent(usuCodigo)}`,
    misReclamos: `${baseUrl}/reclamos/mis-reclamos`,
    historial: (id: string) =>
      `${baseUrl}/reclamos/${encodeURIComponent(id)}/historial`,
    actualizarEstado: (id: string, estado: string) =>
      `${baseUrl}/reclamos/${encodeURIComponent(id)}/estado/${encodeURIComponent(estado)}`,
    asignarPrioridad: (id: string) =>
      `${baseUrl}/reclamos/${encodeURIComponent(id)}/prioridad`,
  },
  servicios: {
    base: `${baseUrl}/servicios`,
    byId: (id: number) => `${baseUrl}/servicios/${encodeURIComponent(String(id))}`,
  },
  avisos: {
    byUsuario: (usuarioId: number) => `${baseUrl}/avisos/${encodeURIComponent(String(usuarioId))}`,
    visto: (aviCod: number) => `${baseUrl}/avisos/${encodeURIComponent(String(aviCod))}/visto`,
  },
} as const;
