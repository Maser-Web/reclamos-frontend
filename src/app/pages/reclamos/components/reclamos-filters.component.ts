import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EstadoReclamo } from '../../../core/constants/reclamo-estados';
import { AppIconComponent } from '../../../core/components/ui';
import { PrioridadReclamo } from '../../../core/interfaces/models';

export type ReclamosFilterOption = { value: EstadoReclamo; label: string };
export type ReclamosStatusCounts = Record<EstadoReclamo, number>;
export type ReclamosPriorityCounts = Record<PrioridadReclamo, number>;

@Component({
  selector: 'app-reclamos-filters', standalone: true, imports: [AppIconComponent],
  template: `<aside class="filters" aria-label="Filtros de reclamos"><header><strong>Filtros</strong><button type="button" (click)="clearRequested.emit()"><app-icon name="x" [size]="15"/>Limpiar</button></header><fieldset><legend>Estado</legend>@for (item of statusOptions(); track item.value) {<label><input type="checkbox" [checked]="activeStatus() === item.value" (change)="statusChanged.emit(item.value)" /><i [class]="item.value"></i>{{ item.label }}<b>{{ statusCounts()[item.value] }}</b></label>}</fieldset><fieldset><legend>Prioridad</legend><label><input type="checkbox" /><i class="alta"></i>Alta<b>{{ priorityCounts().alta }}</b></label><label><input type="checkbox" /><i class="media"></i>Media<b>{{ priorityCounts().media }}</b></label><label><input type="checkbox" /><i class="baja"></i>Baja<b>{{ priorityCounts().baja }}</b></label></fieldset><fieldset><legend>Rango de fechas</legend><button class="select" type="button"><app-icon name="calendar-days" [size]="17"/><span>Últimos 30 días</span><app-icon name="chevron-down" [size]="16"/></button></fieldset><fieldset><legend>Cliente</legend><label class="filter-input"><app-icon name="search" [size]="17"/><input aria-label="Buscar cliente" placeholder="Buscar cliente..." /></label></fieldset><fieldset><legend>Asignado a</legend><label class="filter-input"><app-icon name="search" [size]="17"/><input aria-label="Buscar usuario" placeholder="Buscar usuario..." /></label></fieldset><button class="apply" type="button">Aplicar filtros</button></aside>`,
  styleUrl: './reclamos-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamosFiltersComponent {
  readonly statusOptions = input.required<readonly ReclamosFilterOption[]>();
  readonly statusCounts = input.required<ReclamosStatusCounts>();
  readonly priorityCounts = input.required<ReclamosPriorityCounts>();
  readonly activeStatus = input.required<'todos' | EstadoReclamo>();
  readonly statusChanged = output<EstadoReclamo>();
  readonly clearRequested = output<void>();
}
