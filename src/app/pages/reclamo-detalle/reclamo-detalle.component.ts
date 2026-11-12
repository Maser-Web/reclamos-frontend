import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReclamosService } from '../../core/Services/reclamos.service';
import { NotificationService } from '../../core/Services/notification.service';
import { AuthService } from '../../core/Services/auth.service';
import { AppButtonComponent, AppIconComponent } from '../../core/components/ui';
import { PrioridadReclamo, Reclamo } from '../../core/interfaces/models';
import { RECLAMO_ESTADOS, RECLAMO_ESTADO_ETIQUETAS } from '../../core/constants/reclamo-estados';

@Component({
  standalone: true,
  imports: [AppButtonComponent, AppIconComponent],
  template: `
    @if (reclamo(); as r) {
      <section class="page detail-page">
        <div class="desktop-only">
          <nav class="breadcrumbs" aria-label="Navegación"><button type="button" aria-label="Volver a reclamos" (click)="back()"><app-icon name="chevron-left" [size]="25" /></button><span>Maserlink · Reclamos</span><app-icon name="chevron-right" [size]="18" /><strong>Detalle de reclamo</strong></nav>
          <header class="detail-intro"><span class="intro-icon"><app-icon name="file-text" [size]="34" /></span><div><h1>Detalle de reclamo</h1><p>Consultá y gestioná la información del reclamo.</p></div></header>
        </div>

        <section class="mobile-claim-hero">
          <header class="detail-mobile-nav">
            <button type="button" aria-label="Volver a reclamos" (click)="back()"><app-icon name="chevron-left" [size]="28" /></button>
            <span class="detail-nav-spacer" aria-hidden="true"></span>
            <button type="button" aria-label="Cerrar sesión" (click)="logout()"><app-icon name="log-out" [size]="22" /></button>
          </header>
          <div class="mobile-hero-copy"><h1><span class="hero-maser">Maser</span><span class="hero-link">Link</span></h1><p>Gestión y resolución<br />de reclamos</p></div>
          <img src="assets/reclamo-note.svg" alt="" aria-hidden="true" />
        </section>

        <div class="mobile-claim-summary">
            <p class="mobile-claim-number"><strong>#{{ r.numero }}</strong></p>
            <p class="mobile-claim-description">{{ r.descripcion }}</p>
            <div><b [class]="'mobile-status '+r.estado"><app-icon [name]="r.estado === estados.FINALIZADO ? 'check' : 'inbox'" [size]="20" />{{ statusLabel(r.estado) }}</b><time><app-icon name="calendar-days" [size]="22" />{{ date(r.fechaActualizacion) }}</time></div>
        </div>

        <ol class="mobile-stepper" aria-label="Progreso del reclamo">
          @for (step of steps; track step.label; let last = $last) {
            <li [class.active]="r.estado === step.estado" [class.done]="isStepDone(r.estado, step.estado)"><span><app-icon [name]="step.icon" [size]="25" /></span>@if (!last) {<i></i>}<b>{{ step.label }}</b></li>
          }
        </ol>

        <article class="detail-card">
          <header class="desktop-claim-summary"><b class="desktop-status"><i></i>{{ statusLabel(r.estado) }}</b><time>{{ date(r.fechaActualizacion) }}</time></header>
          <div class="desktop-claim-title"><div><span>N.° de reclamo</span><strong>{{ r.numero }}</strong></div><i></i><div><span>Descripción</span><b>{{ r.descripcion }}</b></div></div>

          <div class="info-grid">
            <div class="info"><span class="info-icon"><app-icon name="user-round" /></span><div><span>Cliente / cuenta</span><b>{{ r.clienteId || 'Sin información' }}</b>@if (r.cuentaNumero) {<small>Cuenta #{{ r.cuentaNumero }}</small>}</div></div>
            <div class="info"><span class="info-icon"><app-icon name="file-text" /></span><div><span class="desktop-label">Derivado a</span><span class="mobile-label">Empleado asignada</span><b>{{ r.responsableNombre || r.responsableId || 'Sin asignar' }}</b></div></div>
          </div>

          <div class="dates"><div><span class="info-icon"><app-icon name="calendar-days" /></span><p><span>Creación</span><b>{{ date(r.fechaCreacion) }}</b></p></div><i></i><div><span class="info-icon"><app-icon name="refresh" /></span><p><span>Actualización</span><b>{{ date(r.fechaActualizacion) }}</b></p></div></div>

          <div class="desktop-actions">
            @if (r.estado !== estados.FINALIZADO) {<app-button label="Finalizar reclamo" icon="check" variant="success" (click)="goClose()" />} @else {<p class="notice">Este reclamo ya está finalizado.</p>}
            <app-button label="Ver seguimiento" icon="clipboard-list" variant="secondary" (click)="goTracking()" />
            <app-button label="Derivar reclamo" icon="refresh" variant="secondary" (click)="goDerive()" />
          </div>
        </article>

        <div class="desktop-priority"><app-button label="Asignar prioridad" icon="flag" variant="secondary" (click)="openPriorityModal(r.prioridad)" /></div>
        <div class="mobile-actions">
          @if (r.estado !== estados.FINALIZADO) {<app-button label="Finalizar reclamo" icon="check" variant="success" (click)="goClose()" />} @else {<p class="notice">Este reclamo ya está finalizado.</p>}
          <app-button label="Ver seguimiento" icon="clipboard-list" variant="secondary" (click)="goTracking()" />
          <app-button label="Derivar reclamo" icon="refresh" variant="secondary" (click)="goDerive()" />
        </div>
      </section>
    } @else {
      <section class="page"><p class="notice">Cargando reclamo o el reclamo no existe.</p></section>
    }

    @if (priorityModalOpen()) {
      <div class="priority-overlay" (click)="closePriorityModal()"><section class="priority-modal" role="dialog" aria-modal="true" aria-labelledby="priority-title" (click)="$event.stopPropagation()"><header><h2 id="priority-title">Asignar prioridad</h2><button type="button" aria-label="Cerrar" (click)="closePriorityModal()"><app-icon name="x" [size]="21" /></button></header><fieldset><legend>Seleccione la prioridad del reclamo</legend>@for (option of priorityOptions; track option.value) {<label><input type="radio" name="priority" [value]="option.value" [checked]="selectedPriority() === option.value" (change)="selectedPriority.set(option.value)" /><span>{{ option.label }}</span></label>}</fieldset><button class="priority-submit" type="button" [disabled]="prioritySaving()" (click)="assignPriority()">{{ prioritySaving() ? 'Asignando prioridad…' : 'Asignar prioridad' }}</button></section></div>
    }
  `,
  styleUrl: './reclamo-detalle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamoDetalleComponent {
  readonly estados = RECLAMO_ESTADOS;
  readonly priorityModalOpen = signal(false);
  readonly prioritySaving = signal(false);
  readonly selectedPriority = signal<PrioridadReclamo>('media');
  readonly priorityOptions: { value: PrioridadReclamo; label: string }[] = [{ value: 'alta', label: 'ALTA' }, { value: 'media', label: 'MEDIA' }, { value: 'baja', label: 'BAJA' }];
  readonly steps = [{ estado: RECLAMO_ESTADOS.RECIBIDOS, label: 'Recibido', icon: 'inbox' }, { estado: RECLAMO_ESTADOS.EN_CURSO, label: 'En curso', icon: 'refresh' }, { estado: RECLAMO_ESTADOS.FINALIZADO, label: 'Finalizado', icon: 'check' }];
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ReclamosService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly reclamo = signal<Reclamo | null>(null);

  constructor() { this.load(); }

  date(value: string): string { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? 'Sin información' : new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(parsed); }
  statusLabel(estado: Reclamo['estado']): string { return RECLAMO_ESTADO_ETIQUETAS[estado]; }
  isStepDone(actual: Reclamo['estado'], step: Reclamo['estado']): boolean { return [RECLAMO_ESTADOS.RECIBIDOS, RECLAMO_ESTADOS.EN_CURSO, RECLAMO_ESTADOS.FINALIZADO].indexOf(step) <= [RECLAMO_ESTADOS.RECIBIDOS, RECLAMO_ESTADOS.EN_CURSO, RECLAMO_ESTADOS.FINALIZADO].indexOf(actual); }
  openPriorityModal(priority: PrioridadReclamo): void { this.selectedPriority.set(priority); this.priorityModalOpen.set(true); }
  closePriorityModal(): void { this.priorityModalOpen.set(false); }
  assignPriority(): void { const reclamo = this.reclamo(); if (!reclamo || this.prioritySaving()) return; const prioridad = this.selectedPriority(); this.prioritySaving.set(true); this.service.asignarPrioridad(reclamo.id, prioridad).subscribe({ next: () => { this.reclamo.update(actual => actual ? { ...actual, prioridad } : null); this.prioritySaving.set(false); this.closePriorityModal(); void this.notifications.success('Prioridad asignada'); }, error: () => { this.prioritySaving.set(false); void this.notifications.error('No se pudo asignar la prioridad', 'Intentá nuevamente.'); } }); }
  goClose(): void { void this.router.navigate(['/reclamos', this.id(), 'cerrar']); }
  goTracking(): void { void this.router.navigate(['/reclamos', this.id(), 'seguimiento']); }
  goDerive(): void { void this.router.navigate(['/reclamos', this.id(), 'adherir-cliente']); }
  back(): void { void this.router.navigateByUrl('/reclamos'); }
  logout(): void { this.auth.logout(); void this.router.navigateByUrl('/login'); }
  private load(): void { this.service.detail(this.id()).subscribe({ next: reclamo => this.reclamo.set(reclamo) }); }
  private id(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }
}
