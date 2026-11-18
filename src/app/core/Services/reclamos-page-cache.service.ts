import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { EstadoFiltroBackend } from '../constants/reclamo-estados';
import { ReclamoVista } from '../interfaces/models';

export type RolReclamos = 'admin' | 'operador';
/** Estado usado en la clave de caché: `TODOS` representa la ausencia del parámetro `estado`. */
export type EstadoFiltroClave = EstadoFiltroBackend | 'TODOS';

/** Identifica una página concreta de la grilla: rol + filtro + ventana de paginación. */
export interface ReclamosPaginaRequest {
  rol: RolReclamos;
  /** `null` = “Todos”: no se envía `estado`. */
  estado: EstadoFiltroBackend | null;
  limit: number;
  offset: number;
}

export interface ReclamosPaginados {
  items: ReclamoVista[];
  limit: number;
  offset: number;
  hasNext: boolean;
}

/** Estados cuyas páginas fueron invalidadas; `null` = se invalidó toda la caché. */
export type ReclamosInvalidacion = ReadonlySet<EstadoFiltroClave> | null;

export const RECLAMOS_CACHE_TTL_MS = 45_000;
export const RECLAMOS_CACHE_MAX_PAGINAS_POR_FILTRO = 3;
export const RECLAMOS_CACHE_MAX_PAGINAS = 30;

/** `reclamos|admin|TODOS|10` — agrupa las páginas de un mismo filtro. */
export function reclamosFiltroKey(request: Omit<ReclamosPaginaRequest, 'offset'>): string {
  return `reclamos|${request.rol}|${request.estado ?? 'TODOS'}|${request.limit}`;
}

/** `reclamos|operador|EN CURSO|10|20` */
export function reclamosPaginaKey(request: ReclamosPaginaRequest): string {
  return `${reclamosFiltroKey(request)}|${request.offset}`;
}

interface Entrada {
  value: ReclamosPaginados;
  expiresAt: number;
  filtroKey: string;
  estado: EstadoFiltroClave;
}

/**
 * Caché temporal de páginas de reclamos (nunca de la lista completa).
 * Usa el orden de inserción del Map como LRU: cada lectura mueve la entrada al final
 * y la expulsión toma la primera (la usada hace más tiempo).
 */
@Injectable({ providedIn: 'root' })
export class ReclamosPageCacheService {
  private readonly entradas = new Map<string, Entrada>();
  private owner: string | null = null;
  private readonly invalidaciones = new Subject<ReclamosInvalidacion>();
  /** Emite tras cada invalidación para que una grilla visible pueda recargarse. */
  readonly invalidaciones$: Observable<ReclamosInvalidacion> = this.invalidaciones.asObservable();

  /** Las páginas de mis-reclamos dependen del usuario: un cambio de sesión vacía la caché. */
  bindOwner(owner: string | null): void {
    if (owner === this.owner) return;
    this.clear();
    this.owner = owner;
  }

  get(request: ReclamosPaginaRequest, now = Date.now()): ReclamosPaginados | null {
    const key = reclamosPaginaKey(request);
    const entrada = this.entradas.get(key);
    if (!entrada) return null;
    this.entradas.delete(key);
    if (entrada.expiresAt <= now) return null;
    this.entradas.set(key, entrada);
    return entrada.value;
  }

  set(request: ReclamosPaginaRequest, value: ReclamosPaginados, now = Date.now()): void {
    const key = reclamosPaginaKey(request);
    const filtroKey = reclamosFiltroKey(request);
    this.entradas.delete(key);
    this.purgarVencidas(now);
    this.expulsarHasta(RECLAMOS_CACHE_MAX_PAGINAS_POR_FILTRO - 1, filtroKey);
    this.expulsarHasta(RECLAMOS_CACHE_MAX_PAGINAS - 1);
    this.entradas.set(key, {
      value,
      expiresAt: now + RECLAMOS_CACHE_TTL_MS,
      filtroKey,
      estado: request.estado ?? 'TODOS',
    });
  }

  /**
   * Invalida las páginas afectadas por crear, derivar o cambiar el estado de un reclamo.
   * Siempre se invalida “Todos” (todas sus páginas: el reclamo puede moverse de página).
   * `estadoAnterior === undefined` significa “desconocido” e invalida todos los estados.
   */
  invalidar(cambio: { estadoAnterior?: EstadoFiltroBackend | null; estadoNuevo?: EstadoFiltroBackend | null }): void {
    if (cambio.estadoAnterior === undefined) {
      this.entradas.clear();
      this.invalidaciones.next(null);
      return;
    }
    const estados = new Set<EstadoFiltroClave>(['TODOS']);
    if (cambio.estadoAnterior) estados.add(cambio.estadoAnterior);
    if (cambio.estadoNuevo) estados.add(cambio.estadoNuevo);
    for (const [key, entrada] of this.entradas) {
      if (estados.has(entrada.estado)) this.entradas.delete(key);
    }
    this.invalidaciones.next(estados);
  }

  /** Aplica un cambio que no altera la pertenencia a ningún filtro (p. ej. la prioridad). */
  actualizarReclamo(id: string, cambios: Partial<ReclamoVista>): void {
    for (const entrada of this.entradas.values()) {
      if (!entrada.value.items.some(item => item.id === id)) continue;
      entrada.value = {
        ...entrada.value,
        items: entrada.value.items.map(item => item.id === id ? { ...item, ...cambios } : item),
      };
    }
  }

  clear(): void { this.entradas.clear(); }

  get size(): number { return this.entradas.size; }

  private purgarVencidas(now: number): void {
    for (const [key, entrada] of this.entradas) {
      if (entrada.expiresAt <= now) this.entradas.delete(key);
    }
  }

  /** Expulsa las entradas menos usadas hasta dejar `max` (opcionalmente dentro de un filtro). */
  private expulsarHasta(max: number, filtroKey?: string): void {
    const candidatas = [...this.entradas].filter(([, entrada]) => !filtroKey || entrada.filtroKey === filtroKey);
    for (let i = 0; i < candidatas.length - max; i++) this.entradas.delete(candidatas[i][0]);
  }
}
