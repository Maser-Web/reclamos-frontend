import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/Services/auth.service';
import { ReclamosApiService } from '../../core/Services/reclamos-api.service';
import { AppButtonComponent, AppHeaderComponent, AppIconComponent } from '../../core/components/ui';
import { NotificationService } from '../../core/Services/notification.service';
import { Servicio } from '../../core/interfaces/servicio.interface';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, AppButtonComponent, AppHeaderComponent, AppIconComponent],
  template: `
    <app-header title="Nuevo reclamo" [showBack]="true" (back)="back()" />
    <main class="page">
      <form class="new-claim-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <header><h2>Ingresá tu reclamo</h2><p>Describí el inconveniente y seleccioná el servicio involucrado.</p></header>
        <label for="motivo">Motivo *</label>
        <textarea id="motivo" formControlName="motivo" maxlength="1000" placeholder="Contanos cuál es el inconveniente..." aria-describedby="motivo-help"></textarea>
        <div id="motivo-help" class="field-help"><span>{{ form.controls.motivo.value.length }}/1000</span>@if (showError('motivo')) { <b>El motivo es obligatorio y no puede contener solo espacios.</b> }</div>
        <label for="servicio">Servicio *</label>
        @if (loadingServices()) {
          <p class="status" role="status">Cargando servicios…</p>
        } @else if (servicesError(); as error) {
          <section class="status error" role="alert"><app-icon name="circle-alert" [size]="18"/><span>{{ error }}</span><button type="button" (click)="loadServices()">Reintentar</button></section>
        } @else {
          <select id="servicio" formControlName="servicio"><option value="">Seleccioná un servicio</option>@for (service of services(); track service.serCodigo) {<option [value]="service.serCodigo">{{ serviceLabel(service) }}</option>}</select>
          @if (!services().length) { <p class="status error" role="alert"><app-icon name="circle-alert" [size]="18"/>No hay servicios disponibles para seleccionar.</p> }
          @if (showError('servicio')) { <p class="field-error">Seleccioná un servicio válido.</p> }
        }
        @if (sessionError(); as error) { <p class="status error" role="alert"><app-icon name="circle-alert" [size]="18"/>{{ error }}</p> }
        <app-button type="submit" label="Crear reclamo" icon="plus" [disabled]="form.invalid || loadingServices() || !!servicesError() || !services().length || saving()" />
      </form>
    </main>
  `,
  styles: `.new-claim-form{display:grid;gap:10px}.new-claim-form header{margin-bottom:12px}.new-claim-form h2{margin:0 0 6px;font-size:var(--font-xl)}.new-claim-form header p{margin:0;color:var(--color-text-secondary);font-size:var(--font-sm)}.new-claim-form label{margin-top:8px;font-weight:800}.field-help{display:flex;justify-content:space-between;gap:12px;min-height:20px;color:var(--color-text-secondary);font-size:var(--font-xs)}.field-help b,.field-error{margin:0;color:var(--color-new);font-weight:700}.status{margin:0;padding:13px;border:1px solid var(--color-border);border-radius:var(--radius-md);color:var(--color-text-secondary);font-size:var(--font-sm)}.status.error{display:flex;align-items:center;gap:9px;border-color:#f3cccc;color:#a51d25;background:#fffafa}.status.error span{flex:1}.status button{border:0;border-radius:8px;padding:6px 8px;background:transparent;color:inherit;font-size:12px;font-weight:800}.new-claim-form app-button{margin-top:14px}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamoNuevoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ReclamosApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  readonly services = signal<Servicio[]>([]);
  readonly loadingServices = signal(false);
  readonly servicesError = signal<string | null>(null);
  readonly sessionError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({ motivo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)]], servicio: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]] });

  constructor() { this.loadServices(); }

  loadServices(): void {
    this.loadingServices.set(true); this.servicesError.set(null);
    this.api.obtenerServicios().subscribe({
      next: services => this.services.set((services ?? []).filter(service => /^[1-9]\d*$/.test(service.serCodigo))),
      error: error => this.servicesError.set(this.apiErrorMessage(error, 'No pudimos cargar los servicios. Intentá nuevamente.')),
      complete: () => this.loadingServices.set(false),
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    const usuCodigo = this.auth.usuarioCodigo();
    if (!Number.isInteger(usuCodigo) || !usuCodigo || usuCodigo < 1) { this.sessionError.set('No hay una sesión válida para crear el reclamo. Volvé a iniciar sesión.'); return; }
    if (this.form.invalid || this.loadingServices() || this.servicesError() || !this.services().length) return;
    this.saving.set(true); this.sessionError.set(null);
    const value = this.form.getRawValue();
    this.api.crearReclamo({ motivo: value.motivo.trim(), usu_codigo: usuCodigo, servicio: Number(value.servicio) }).subscribe({
      next: () => { void this.notifications.success('Reclamo creado', 'El reclamo fue registrado correctamente.'); void this.router.navigateByUrl('/reclamos'); },
      error: error => { this.saving.set(false); void this.notifications.error('No se pudo crear el reclamo', this.apiErrorMessage(error, 'Ocurrió un error inesperado. Intentá nuevamente.')); },
      complete: () => this.saving.set(false),
    });
  }

  back(): void { void this.router.navigateByUrl('/reclamos'); }
  showError(control: 'motivo' | 'servicio'): boolean { const field = this.form.controls[control]; return field.touched && field.invalid; }
  serviceLabel(service: Servicio): string { return `${service.serCodigo} — ${service.serDescri?.trim() || 'Sin descripción'}`; }
  private apiErrorMessage(error: unknown, fallback: string): string { if (typeof error === 'object' && error !== null && 'error' in error) { const body = error.error; if (typeof body === 'object' && body !== null && 'mensaje' in body && typeof body.mensaje === 'string') return body.mensaje; } return fallback; }
}
