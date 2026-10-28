import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppButtonComponent, AppHeaderComponent } from '../../core/components/ui';
import { EstadoReclamo, RECLAMO_ESTADOS, RECLAMO_ESTADO_ETIQUETAS } from '../../core/constants/reclamo-estados';

@Component({
  standalone: true,
  imports: [AppHeaderComponent, AppButtonComponent],
  template: `<app-header title="Filtrar reclamos" [showBack]="true" (back)="back()"/><section class="page"><form class="filters" (submit)="apply($event)"><h2>Estado</h2>@for(s of estados;track s){<label><input type="checkbox" [value]="s" (change)="toggleEstado(s,$any($event.target).checked)" [checked]="selected().includes(s)"/> {{label(s)}}</label>}<p>El backend actual no ofrece filtros por área ni por fecha. El filtro de estado se aplica sobre la página cargada.</p><app-button type="submit" label="Aplicar filtros"/><app-button label="Limpiar" variant="secondary" (click)="clear()"/></form></section>`,
  styles: `.filters{display:grid;gap:14px}.filters h2{margin:12px 0 0}.filters label{font-size:var(--font-md);display:flex;gap:12px;align-items:center}.filters p{color:var(--color-text-secondary);line-height:1.5}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamosFiltrosComponent {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly estados: EstadoReclamo[] = [RECLAMO_ESTADOS.RECIBIDOS, RECLAMO_ESTADOS.ASIGNADOS, RECLAMO_ESTADOS.FINALIZADO];
  readonly selected = signal<EstadoReclamo[]>([]);

  constructor() {
    this.selected.set((this.route.snapshot.queryParamMap.get('estados')?.split(',').filter(Boolean) ?? []) as EstadoReclamo[]);
  }

  toggleEstado(estado: EstadoReclamo, selected: boolean): void {
    this.selected.update(estados => selected ? [...estados, estado] : estados.filter(item => item !== estado));
  }
  apply(event: Event): void {
    event.preventDefault();
    void this.router.navigate(['/reclamos'], { queryParams: { estados: this.selected().join(',') || null } });
  }
  clear(): void { void this.router.navigate(['/reclamos/filtros']); this.selected.set([]); }
  back(): void { void this.router.navigateByUrl('/reclamos'); }
  label(estado: EstadoReclamo): string { return RECLAMO_ESTADO_ETIQUETAS[estado]; }
}
