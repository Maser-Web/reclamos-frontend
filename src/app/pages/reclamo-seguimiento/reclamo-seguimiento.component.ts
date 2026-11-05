import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AppButtonComponent, AppHeaderComponent, AppIconComponent } from '../../core/components/ui';
import { EstadoReclamo, RECLAMO_ESTADOS, RECLAMO_ESTADO_ETIQUETAS } from '../../core/constants/reclamo-estados';
import { ReclamosService } from '../../core/Services/reclamos.service';
import { ReclamoVista, Seguimiento } from '../../core/interfaces/models';

type StepperItem = { estado: EstadoReclamo; label: string; event?: Seguimiento; completed: boolean; current: boolean };

@Component({
  standalone: true,
  imports: [AppHeaderComponent, AppButtonComponent, AppIconComponent],
  template: `
    <app-header title="Seguimiento" [showBack]="true" (back)="back()" />
    <section class="page tracking-page">
      <header class="tracking-header"><p>HISTORIAL DEL RECLAMO</p><h2>Seguimiento</h2><span>Consultá cada cambio de estado registrado para este reclamo.</span></header>
      @if (loading()) {
        <section class="tracking-card loading" role="status">Cargando historial…</section>
      } @else {
        @if (error()) {<p class="tracking-error" role="alert">No pudimos cargar los movimientos; se muestra el estado inicial del reclamo.</p>}
        <section class="tracking-card" aria-label="Progreso del reclamo">
          <ol class="stepper">
            @for (step of stepper(); track step.estado; let last = $last) {
              <li [class.completed]="step.completed" [class.current]="step.current">
                <div class="step-marker" aria-hidden="true">@if (step.completed) {<app-icon name="check" [size]="16"/>} @else {<i></i>}</div>
                @if (!last) {<span class="step-line" aria-hidden="true"></span>}
                <div class="step-content"><strong>{{ step.label }}</strong>@if (step.event; as event) {<span>{{ event.titulo }}</span>@if (event.detalle) {<small>{{ event.detalle }}</small>}<time>{{ formatDate(event.fecha) }} · {{ formatTime(event) }}</time>} @else if (step.current) {<span>Estado actual</span><small>El reclamo fue recibido y está pendiente de atención.</small>} @else {<span>Pendiente</span>}</div>
              </li>
            }
          </ol>
        </section>
        @if (historial().length) {<section class="history" aria-label="Detalle de movimientos"><h2>Movimientos</h2>@for (event of historial(); track event.id) {<article><i></i><div><strong>{{ event.titulo }}</strong>@if (event.detalle) {<p>{{ event.detalle }}</p>}<span>{{ event.autor || 'Sistema' }} · {{ formatDate(event.fecha) }} · {{ formatTime(event) }}</span></div></article>}</section>}
      }
    </section>
  `,
  styleUrl: './reclamo-seguimiento.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamoSeguimientoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reclamosService = inject(ReclamosService);
  readonly historial = signal<Seguimiento[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly stepper = computed<StepperItem[]>(() => {
    const events = [...this.historial()].sort((a, b) => this.dateValue(a.fecha) - this.dateValue(b.fecha));
    const eventByState = new Map<EstadoReclamo, Seguimiento>();
    for (const event of events) {
      const estado = this.estadoFromEvent(event);
      if (estado) eventByState.set(estado, event);
    }
    const current = [...eventByState.keys()].at(-1) ?? RECLAMO_ESTADOS.RECIBIDOS;
    return [RECLAMO_ESTADOS.RECIBIDOS, RECLAMO_ESTADOS.EN_CURSO, RECLAMO_ESTADOS.FINALIZADO].map(estado => ({
      estado,
      label: RECLAMO_ESTADO_ETIQUETAS[estado],
      event: eventByState.get(estado),
      // El estado inicial activo conserva el indicador de estado actual, no el check de un paso cerrado.
      completed: eventByState.has(estado) && !(estado === RECLAMO_ESTADOS.RECIBIDOS && current === estado),
      current: current === estado,
    }));
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    forkJoin({
      reclamo: this.reclamosService.detail(id).pipe(catchError(() => of(null))),
      historial: this.reclamosService.historial(id).pipe(catchError(() => {
        this.error.set(true);
        return of([]);
      })),
    }).subscribe({
      next: ({ reclamo, historial }) => {
        const movimientos = reclamo
          ? historial.length
            ? [this.receivedEvent(reclamo), ...historial.filter(event => event.tipo !== 'creado')]
            : this.trackingEventsFromClaim(reclamo)
          : historial;
        this.historial.set([...movimientos].sort((a, b) => this.dateValue(b.fecha) - this.dateValue(a.fecha)));
        this.loading.set(false);
      },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date);
  }

  formatTime(event: Seguimiento): string {
    if (event.hora) return event.hora.slice(0, 5);
    const date = new Date(event.fecha);
    return Number.isNaN(date.getTime()) ? 'Hora no disponible' : new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  }

  back(): void { void this.router.navigate(['/reclamos', this.route.snapshot.paramMap.get('id') ?? '']); }

  private receivedEvent(reclamo: ReclamoVista): Seguimiento {
    return {
      id: `recibido-${reclamo.id}`,
      reclamoId: reclamo.id,
      titulo: 'Estado Recibido',
      fecha: reclamo.fechaCreacion,
      hora: reclamo.horaCreacion ?? undefined,
      tipo: 'creado',
    };
  }

  /**
   * Algunos reclamos anteriores no tienen movimientos en el historial. En ese
   * caso se conservan los mismos pasos visuales usando las fechas reales del
   * reclamo, en lugar de mostrar estados pendientes que ya fueron realizados.
   */
  private trackingEventsFromClaim(reclamo: ReclamoVista): Seguimiento[] {
    const events = [this.receivedEvent(reclamo)];

    if (reclamo.fechaDerivacion) {
      events.push({
        id: `asignado-${reclamo.id}`,
        reclamoId: reclamo.id,
        titulo: 'Estado Asignado',
        fecha: reclamo.fechaDerivacion,
        hora: reclamo.horaDerivacion ?? undefined,
        tipo: 'asignado',
      });
    }

    if (reclamo.fechaFinalizacion) {
      events.push({
        id: `finalizado-${reclamo.id}`,
        reclamoId: reclamo.id,
        titulo: 'Estado Finalizado',
        fecha: reclamo.fechaFinalizacion,
        hora: reclamo.horaFinalizacion ?? undefined,
        tipo: 'cerrado',
      });
    }

    return events;
  }

  private estadoFromEvent(event: Seguimiento): EstadoReclamo | null {
    switch (event.tipo) {
      case 'creado': return RECLAMO_ESTADOS.RECIBIDOS;
      case 'asignado':
      case 'gestion': return RECLAMO_ESTADOS.EN_CURSO;
      case 'cerrado': return RECLAMO_ESTADOS.FINALIZADO;
      default: return null;
    }
  }

  private dateValue(value: string): number {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
