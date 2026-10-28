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
  styles: `:host{display:block}.filters{align-self:start;padding:21px;border-radius:19px;background:#fff;box-shadow:0 8px 26px #2339630b}.filters header{display:flex;justify-content:space-between;align-items:center;margin-bottom:26px}.filters header strong{font-size:16px}.filters header button{display:flex;align-items:center;gap:5px;border:0;border-radius:8px;padding:9px 12px;background:#f5f7fb;color:#53617d;font:700 13px var(--font-family)}fieldset{display:grid;gap:13px;margin:0 0 28px;padding:0;border:0}legend{margin-bottom:15px;font-size:14px;font-weight:800}fieldset>label{display:grid;grid-template-columns:21px 10px 1fr auto;align-items:center;gap:10px;color:#53617b;font-size:14px;font-weight:600}input[type=checkbox]{appearance:none;width:21px;height:21px;margin:0;border:1px solid #d7deea;border-radius:5px}input[type=checkbox]:checked{border-color:#2879ee;background:#2879ee}input[type=checkbox]:checked:after{content:'✓';display:block;color:#fff;text-align:center}label>i{width:10px;height:10px;border-radius:50%;background:#a7b1c0}i.nuevo,i.alta{background:#f33142}i.en-gestion{background:#ff8200}i.cerrado{background:#11b976}i.media{background:#ffc900}.select,.filter-input{height:40px;display:flex!important;align-items:center!important;gap:8px;padding:0 13px;border:1px solid #d6deea;border-radius:8px;background:#fff;color:#67748e;font:600 13px var(--font-family)}.select{justify-content:space-between}.select span{flex:1;text-align:left}.filter-input{grid-template-columns:18px 1fr!important}.filter-input input{min-width:0;border:0;outline:0;font:inherit}.apply{width:100%;height:51px;border:0;border-radius:11px;background:linear-gradient(90deg,#ffdc18,#ffd000);color:#101a33;font:800 14px var(--font-family)}@media(max-width:767px){:host{display:none}}@media(max-width:1150px) and (min-width:768px){.filters{padding:17px}}i.RECIBIDOS{background:#f33142}i.ASIGNADOS{background:#ff8200}i.FINALIZADO{background:#11b976}`,
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
