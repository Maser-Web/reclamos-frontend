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
  styles: `.detail-card{background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:22px;margin-bottom:14px}.split,.dates{display:flex;justify-content:space-between;gap:12px}.split time,p,small,span{color:var(--color-text-secondary)}h2{font-size:var(--font-xl);margin:24px 0 8px}p{font-size:var(--font-md);margin:0 0 22px}.info{border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;display:flex;gap:14px;margin-top:12px}.info div{display:grid;gap:4px}.dates{margin-top:14px;padding:16px;border:1px solid var(--color-border);border-radius:var(--radius-md);font-size:var(--font-sm)}.notice{padding:16px;color:var(--color-text-secondary);text-align:center}`,
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
