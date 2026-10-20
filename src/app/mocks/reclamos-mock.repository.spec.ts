import { ReclamosMockRepository } from './reclamos-mock.repository';

describe('ReclamosMockRepository', () => {
  it('filters claims and keeps a derived assignment in memory', () => {
    const repository = new ReclamosMockRepository();
    repository.getAll({ estados: ['nuevo'] }).subscribe(items => expect(items.every(item => item.estado === 'nuevo')).toBeTrue());
    repository.derive('1256', { areaId: 'facturacion', responsableId: 'maria' }).subscribe();
    repository.getById('1256').subscribe(item => expect(item?.responsableId).toBe('maria'));
  });

  it('closes a claim and registers its tracking event', () => {
    const repository = new ReclamosMockRepository();
    repository.close('1254', { motivo: 'Resuelto', notificarCliente: false }).subscribe();
    repository.getTracking('1254').subscribe(events => expect(events.at(-1)?.tipo).toBe('cerrado'));
  });
});
