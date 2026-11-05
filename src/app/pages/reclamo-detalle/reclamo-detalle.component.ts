import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReclamosService } from '../../core/Services/reclamos.service';
import { AppButtonComponent, AppHeaderComponent, AppIconComponent, StatusBadgeComponent } from '../../core/components/ui';
import { Reclamo } from '../../core/interfaces/models';
import { RECLAMO_ESTADOS } from '../../core/constants/reclamo-estados';

@Component({
  standalone: true,
  imports: [AppHeaderComponent, AppButtonComponent, AppIconComponent, StatusBadgeComponent],
  template: `<app-header title="Reclamo" [showBack]="true" (back)="back()"/>@if(reclamo(); as r){<section class="page"><article class="detail-card"><div class="split"><app-status-badge [status]="r.estado"/><time>{{date(r.fechaCreacion)}}</time></div><h2>{{r.numero}}</h2><p>{{r.descripcion}}</p><div class="info"><app-icon name="user-round"/><div><span>Cliente / cuenta</span><b>{{r.clienteId || 'Sin información'}}</b></div></div><div class="info"><app-icon name="file-text"/><div><span>Derivado a</span><b>{{r.responsableNombre || r.responsableId || 'Sin asignar'}}</b></div></div><div class="dates"><span>Creación<br/><b>{{date(r.fechaCreacion)}}</b></span><span>Actualización<br/><b>{{date(r.fechaActualizacion)}}</b></span></div></article>@if(r.estado !== estados.FINALIZADO){<app-button label="Finalizar reclamo" icon="check" variant="success" (click)="goClose()"/>}@else{<p class="notice">Este reclamo ya está finalizado.</p>}<app-button label="Ver seguimiento" icon="clipboard-list" variant="secondary" (click)="goTracking()"/></section>}@else{<section class="page"><p class="notice">Cargando reclamo o el reclamo no existe.</p></section>}`,
  styleUrl: './reclamo-detalle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamoDetalleComponent {
  readonly estados = RECLAMO_ESTADOS;
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ReclamosService);
  readonly router = inject(Router);
  readonly reclamo = signal<Reclamo | null>(null);

  constructor() { this.load(); }

  date(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Sin información' : new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(parsed);
  }

  goClose(): void { void this.router.navigate(['/reclamos', this.id(), 'cerrar']); }
  goTracking(): void { void this.router.navigate(['/reclamos', this.id(), 'seguimiento']); }
  back(): void { void this.router.navigateByUrl('/reclamos'); }

  private load(): void { this.service.detail(this.id()).subscribe({ next: reclamo => this.reclamo.set(reclamo) }); }
  private id(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }
}
