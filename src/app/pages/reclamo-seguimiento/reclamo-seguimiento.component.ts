import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppButtonComponent, AppHeaderComponent, AppIconComponent } from '../../core/components/ui';
import { EstadoReclamo, RECLAMO_ESTADOS, RECLAMO_ESTADO_ETIQUETAS } from '../../core/constants/reclamo-estados';
import { ReclamosService } from '../../core/Services/reclamos.service';
import { Seguimiento } from '../../core/interfaces/models';

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
      } @else if (error()) {
        <section class="tracking-card message"><h2>No pudimos cargar el seguimiento</h2><p>Intentá nuevamente más tarde.</p><app-button label="Volver al reclamo" (click)="back()" /></section>
      } @else if (!historial().length) {
        <section class="tracking-card message"><h2>Sin movimientos registrados</h2><p>El reclamo todavía no cuenta con cambios de estado en su historial.</p><app-button label="Volver al reclamo" (click)="back()" /></section>
      } @else {
        <section class="tracking-card" aria-label="Progreso del reclamo">
          <ol class="stepper">
            @for (step of stepper(); track step.estado; let last = $last) {
              <li [class.completed]="step.completed" [class.current]="step.current">
                <div class="step-marker" aria-hidden="true">@if (step.completed) {<app-icon name="check" [size]="16"/>} @else {<i></i>}</div>
                @if (!last) {<span class="step-line" aria-hidden="true"></span>}
                <div class="step-content"><strong>{{ step.label }}</strong>@if (step.event; as event) {<span>{{ event.titulo }}</span>@if (event.detalle) {<small>{{ event.detalle }}</small>}<time>{{ formatDate(event.fecha) }} · {{ formatTime(event) }}</time>} @else {<span>Pendiente</span>}</div>
              </li>
            }
          </ol>
        </section>
        <section class="history" aria-label="Detalle de movimientos"><h2>Movimientos</h2>@for (event of historial(); track event.id) {<article><i></i><div><strong>{{ event.titulo }}</strong>@if (event.detalle) {<p>{{ event.detalle }}</p>}<span>{{ event.autor || 'Sistema' }} · {{ formatDate(event.fecha) }} · {{ formatTime(event) }}</span></div></article>}</section>
      }
    </section>
  `,
  styles: `
    .tracking-page{display:grid;gap:20px}.tracking-header p{margin:0 0 6px;color:var(--color-text-secondary);font-size:12px;font-weight:800}.tracking-header h2{margin:0 0 6px;font-size:var(--font-xl);letter-spacing:-.04em}.tracking-header>span{color:var(--color-text-secondary);font-size:var(--font-sm);line-height:1.45}.tracking-card,.history{border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface);box-shadow:var(--shadow)}.tracking-card{padding:24px}.loading{color:var(--color-text-secondary);text-align:center}.message{display:grid;gap:12px;text-align:center}.message h2,.message p{margin:0}.message p{color:var(--color-text-secondary);line-height:1.45}.message app-button{margin-top:6px}.stepper{display:flex;justify-content:space-between;gap:0;margin:0;padding:0;list-style:none}.stepper li{position:relative;z-index:0;flex:1;min-width:0;display:grid;grid-template-columns:30px 1fr;column-gap:11px}.step-marker{position:relative;z-index:2;width:30px;height:30px;display:grid;place-items:center;border:2px solid var(--color-border);border-radius:50%;background:var(--color-surface);color:transparent;font-size:15px;font-weight:900}.step-marker i{width:8px;height:8px;border-radius:50%;background:#a6b1c0}.step-line{position:absolute;z-index:1;top:14px;left:30px;right:0;height:2px;background:var(--color-border)}.completed .step-marker{border-color:var(--color-primary);background:var(--color-primary);color:var(--color-text)}.completed .step-line{background:var(--color-primary)}.current .step-marker{box-shadow:0 0 0 5px #ffe889}.step-content{display:grid;gap:4px;padding:3px 14px 0 0}.step-content strong{font-size:var(--font-sm)}.step-content span,.step-content small,.step-content time{color:var(--color-text-secondary);font-size:12px;line-height:1.35}.step-content time{font-weight:700}.history{padding:20px}.history h2{margin:0 0 16px;font-size:var(--font-md)}.history article{position:relative;display:grid;grid-template-columns:18px 1fr;gap:12px;padding:0 0 19px}.history article:last-child{padding-bottom:0}.history article:not(:last-child):before{position:absolute;top:17px;bottom:0;left:8px;width:2px;background:var(--color-border);content:''}.history article>i{position:relative;z-index:1;width:18px;height:18px;border-radius:50%;background:var(--color-primary)}.history article>div{display:grid;gap:4px}.history strong{font-size:var(--font-sm)}.history p,.history span{margin:0;color:var(--color-text-secondary);font-size:var(--font-sm);line-height:1.4}.history span{font-size:12px;font-weight:700}@media(max-width:600px){.tracking-card{padding:20px}.stepper{display:grid;gap:0}.stepper li{min-height:93px;grid-template-columns:30px 1fr}.stepper li:last-child{min-height:30px}.step-line{top:30px;bottom:0;left:14px;right:auto;width:2px;height:auto}.step-content{padding:4px 0 17px 4px}.step-content strong{font-size:var(--font-md)}.tracking-header h2{font-size:28px}}
  `,
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
    const current = [...eventByState.keys()].at(-1);
    return [RECLAMO_ESTADOS.RECIBIDOS, RECLAMO_ESTADOS.ASIGNADOS, RECLAMO_ESTADOS.FINALIZADO].map(estado => ({ estado, label: RECLAMO_ESTADO_ETIQUETAS[estado], event: eventByState.get(estado), completed: eventByState.has(estado), current: current === estado }));
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.reclamosService.historial(id).subscribe({
      next: historial => { this.historial.set([...historial].sort((a, b) => this.dateValue(b.fecha) - this.dateValue(a.fecha))); this.loading.set(false); },
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

  private estadoFromEvent(event: Seguimiento): EstadoReclamo | null {
    switch (event.tipo) {
      case 'creado': return RECLAMO_ESTADOS.RECIBIDOS;
      case 'asignado':
      case 'gestion': return RECLAMO_ESTADOS.ASIGNADOS;
      case 'cerrado': return RECLAMO_ESTADOS.FINALIZADO;
      default: return null;
    }
  }

  private dateValue(value: string): number {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
