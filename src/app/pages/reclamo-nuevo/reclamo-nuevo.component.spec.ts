import { ActivatedRoute, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from '../../core/Services/auth.service';
import { ReclamosApiService } from '../../core/Services/reclamos-api.service';
import { ClientesService } from '../../core/Services/clientes.service';
import { MotivosReclamosService } from '../../core/Services/motivos-reclamos.service';
import { NotificationService } from '../../core/Services/notification.service';
import { AvisosService } from '../../core/Services/avisos.service';
import { ReclamoNuevoComponent } from './reclamo-nuevo.component';

describe('ReclamoNuevoComponent', () => {
  let fixture: ComponentFixture<ReclamoNuevoComponent>;
  let component: ReclamoNuevoComponent;
  const api = {
    crearReclamo: jasmine.createSpy('crearReclamo').and.returnValue(of(null)),
  };
  const clientesService = {
    buscar: jasmine.createSpy('buscar').and.returnValue(of({ codigo: 200, mensaje: 'OK', data: [{ cliCodigo: 19, cliNombre: 'Cliente de prueba' }] })),
  };
  const motivosService = {
    apertura: jasmine.createSpy('apertura').and.returnValue(of([{ mtrCodigo: 1, mtrDescri: 'Sin suministro', mtrTipo: 1 }])),
  };
  const router = {
    events: of(),
    url: '/',
    createUrlTree: () => ({}),
    serializeUrl: () => '/',
    navigateByUrl: jasmine.createSpy('navigateByUrl').and.resolveTo(true),
  };

  beforeEach(async () => {
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
        { provide: NotificationService, useValue: { success: jasmine.createSpy('success').and.resolveTo(undefined) } },
        { provide: AvisosService, useValue: { pendientes: signal(0) } },
        { provide: AuthService, useValue: { usuarioCodigo: signal(7), usuarioNombre: signal('Operador'), logout: () => undefined } },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ReclamoNuevoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads motivos and rejects a blank-only reason locally', () => {
    expect(motivosService.apertura).toHaveBeenCalled();
    expect(clientesService.buscar).not.toHaveBeenCalled();
    component.form.controls.motivo.setValue('   ');
    component.form.controls.cliente.setValue('19');
    component.submit();
    expect(component.form.controls.motivo.invalid).toBeTrue();
    expect(api.crearReclamo).not.toHaveBeenCalled();
  });

  it('submits the selected client in the supported payload and returns to the list', () => {
    component.form.setValue({ cliente: '19', motivo: ' No tengo suministro eléctrico ' });
    component.submit();
    expect(api.crearReclamo).toHaveBeenCalledWith({ motivo: 'No tengo suministro eléctrico', usu_codigo: 19 });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/reclamos');
  });
});
