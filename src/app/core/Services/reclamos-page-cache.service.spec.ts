import {
  RECLAMOS_CACHE_MAX_PAGINAS,
  RECLAMOS_CACHE_TTL_MS,
  ReclamosPageCacheService,
  ReclamosPaginaRequest,
  reclamosPaginaKey,
} from './reclamos-page-cache.service';

const page = (offset: number) => ({ items: [], limit: 10, offset, hasNext: true });
const req = (estado: ReclamosPaginaRequest['estado'], offset: number, rol: ReclamosPaginaRequest['rol'] = 'admin'): ReclamosPaginaRequest =>
  ({ rol, estado, limit: 10, offset });

describe('ReclamosPageCacheService', () => {
  let cache: ReclamosPageCacheService;

  beforeEach(() => { cache = new ReclamosPageCacheService(); });

  it('builds keys with role, estado, limit and offset', () => {
    expect(reclamosPaginaKey(req(null, 0))).toBe('reclamos|admin|TODOS|10|0');
    expect(reclamosPaginaKey(req('RECIBIDO', 0))).toBe('reclamos|admin|RECIBIDO|10|0');
    expect(reclamosPaginaKey(req('EN CURSO', 20, 'operador'))).toBe('reclamos|operador|EN CURSO|10|20');
  });

  it('expires pages after the TTL', () => {
    cache.set(req(null, 0), page(0), 1_000);
    expect(cache.get(req(null, 0), 1_000 + RECLAMOS_CACHE_TTL_MS - 1)).not.toBeNull();
    expect(cache.get(req(null, 0), 1_000 + RECLAMOS_CACHE_TTL_MS)).toBeNull();
  });

  it('keeps at most 3 pages per filter, evicting the least recently used', () => {
    cache.set(req('RECIBIDO', 0), page(0), 0);
    cache.set(req('RECIBIDO', 10), page(10), 0);
    cache.set(req('RECIBIDO', 20), page(20), 0);
    cache.get(req('RECIBIDO', 0), 0);
    cache.set(req('RECIBIDO', 30), page(30), 0);

    expect(cache.get(req('RECIBIDO', 10), 0)).toBeNull();
    expect(cache.get(req('RECIBIDO', 0), 0)).not.toBeNull();
    expect(cache.get(req('RECIBIDO', 30), 0)).not.toBeNull();
  });

  it('keeps at most 30 pages in total', () => {
    const roles = ['admin', 'operador'] as const;
    const estados = [null, 'RECIBIDO', 'EN CURSO', 'FINALIZADO'] as const;
    for (let n = 0; n < 3; n++) {
      for (const rol of roles) for (const estado of estados) cache.set(req(estado, n * 10, rol), page(n * 10), 0);
    }
    for (let i = 0; i < 12; i++) cache.set({ rol: 'admin', estado: null, limit: 10 + i, offset: 0 }, page(0), 0);
    expect(cache.size).toBe(RECLAMOS_CACHE_MAX_PAGINAS);
  });

  it('invalidates Todos and the previous and new states only', () => {
    cache.set(req(null, 10), page(10), 0);
    cache.set(req('RECIBIDO', 0), page(0), 0);
    cache.set(req('EN CURSO', 0), page(0), 0);
    cache.set(req('FINALIZADO', 0), page(0), 0);

    cache.invalidar({ estadoAnterior: 'RECIBIDO', estadoNuevo: 'EN CURSO' });

    expect(cache.get(req(null, 10), 0)).toBeNull();
    expect(cache.get(req('RECIBIDO', 0), 0)).toBeNull();
    expect(cache.get(req('EN CURSO', 0), 0)).toBeNull();
    expect(cache.get(req('FINALIZADO', 0), 0)).not.toBeNull();
  });

  it('clears everything when the previous state is unknown or the session owner changes', () => {
    cache.bindOwner('1');
    cache.set(req('FINALIZADO', 0), page(0), 0);
    cache.invalidar({ estadoAnterior: undefined });
    expect(cache.size).toBe(0);

    cache.set(req('FINALIZADO', 0), page(0), 0);
    cache.bindOwner('2');
    expect(cache.size).toBe(0);
  });
});
