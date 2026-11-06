import { Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from '../../core/Services/auth.service';
import { ReclamosApiService } from '../../core/Services/reclamos-api.service';
import { ClientesService } from '../../core/Services/clientes.service';
import { MotivosReclamosService } from '../../core/Services/motivos-reclamos.service';
import { ReclamoNuevoComponent } from './reclamo-nuevo.component';

describe('ReclamoNuevoComponent', () => {
  let fixture: ComponentFixture<ReclamoNuevoComponent>;
  let component: ReclamoNuevoComponent;
  const api = {
    obtenerServicios: jasmine.createSpy('obtenerServicios').and.returnValue(of([{ serCodigo: '2', serDescri: 'Energía' }])),
    crearReclamo: jasmine.createSpy('crearReclamo').and.returnValue(of(null)),
  };
  const clientesService = {
    buscar: jasmine.createSpy('buscar').and.returnValue(of({ codigo: 200, mensaje: 'OK', data: [{ cliCodigo: 19, cliNombre: 'Cliente de prueba' }] })),
  };
  const motivosService = {
    apertura: jasmine.createSpy('apertura').and.returnValue(of([{ mtrCodigo: 1, mtrDescri: 'Sin suministro', mtrTipo: 1 }])),
  };
  const router = { navigateByUrl: jasmine.createSpy('navigateByUrl').and.resolveTo(true) };

  beforeEach(async () => {
    api.obtenerServicios.calls.reset();
    clientesService.buscar.calls.reset();
    motivosService.apertura.calls.reset();
    api.crearReclamo.calls.reset();
    await TestBed.configureTestingModule({
      imports: [ReclamoNuevoComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ReclamosApiService, useValue: api },
        { provide: ClientesService, useValue: clientesService },
        { provide: MotivosReclamosService, useValue: motivosService },
        { provide: AuthService, useValue: { usuarioCodigo: signal(7), usuarioNombre: signal('Operador'), logout: () => undefined } },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ReclamoNuevoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads selectable services and rejects a blank-only reason locally', () => {
    expect(api.obtenerServicios).toHaveBeenCalled();
    expect(motivosService.apertura).toHaveBeenCalled();
    expect(clientesService.buscar).not.toHaveBeenCalled();
    expect(component.services()).toEqual([jasmine.objectContaining({ serCodigo: '2' })]);
    component.form.controls.motivo.setValue('   ');
    component.form.controls.cliente.setValue('19');
    component.form.controls.servicio.setValue('2');
    component.submit();
    expect(component.form.controls.motivo.invalid).toBeTrue();
    expect(api.crearReclamo).not.toHaveBeenCalled();
  });

  it('submits the selected client in the supported payload and returns to the list', () => {
    component.form.setValue({ cliente: '19', motivo: ' No tengo suministro eléctrico ', servicio: '2' });
    component.submit();
    expect(api.crearReclamo).toHaveBeenCalledWith({ motivo: 'No tengo suministro eléctrico', usu_codigo: 19, servicio: 2 });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/reclamos');
  });

  it('blocks submission while the services request is in an error state', () => {
    component.servicesError.set('No pudimos cargar los servicios.');
    component.form.setValue({ cliente: '19', motivo: 'Sin luz', servicio: '2' });
    component.submit();
    expect(api.crearReclamo).not.toHaveBeenCalled();
  });
});
