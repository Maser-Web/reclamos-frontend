import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/Services/auth.service';
import { ReclamosService } from '../../core/Services/reclamos.service';
import { NotificationService } from '../../core/Services/notification.service';
import { PrioridadReclamo, Reclamo } from '../../core/interfaces/models';
import { EstadoReclamo, RECLAMO_ESTADOS, RECLAMO_ESTADO_ETIQUETAS } from '../../core/constants/reclamo-estados';
import { ReclamosFiltersComponent, ReclamosPriorityCounts, ReclamosStatusCounts } from './components/reclamos-filters.component';
import { ReclamosNavbarComponent } from './components/reclamos-navbar.component';
import { AppIconComponent } from '../../core/components/ui';

type StatusFilter = 'todos' | EstadoReclamo;

@Component({
  standalone: true,
  imports: [ReclamosNavbarComponent, ReclamosFiltersComponent, AppIconComponent],
  template: `
    <main class="claims-page" [class.read-only]="auth.esOperador()">
      <app-reclamos-navbar [usuarioNombre]="auth.usuarioNombre()" (logoutRequested)="logout()" />
      <section class="mobile-hero">
        <div><h1><span class="hero-maser">Maser</span><span class="hero-link">Link</span></h1><p>Gestión y resolución<br />de reclamos</p></div>
        <img src="assets/reclamo-note.svg" alt="" aria-hidden="true" />
      </section>
      <section class="workspace">
        <app-reclamos-filters
          [statusOptions]="statusOptions"
          [statusCounts]="statusCounts()"
          [priorityCounts]="priorityCounts()"
          [activeStatus]="activeStatus()"
          (statusChanged)="setStatus($event)"
          (clearRequested)="showAll()" />
        <section class="content">
          <header class="page-title"><p>GESTIÓN DE RECLAMOS</p><div><section><h1>Gestión de reclamos</h1><span>Gestioná y hacé seguimiento de todos los reclamos de clientes.</span></section><button type="button" (click)="create()"><app-icon name="plus" [size]="17" />Nuevo reclamo</button></div></header>
          <section class="summary">@for (item of summary(); track item.label) {<article [class]="item.class"><i><app-icon [name]="item.icon" [size]="28" /></i><div><b>{{ item.count }}</b><strong>{{ item.label }}</strong><small>{{ item.detail }}</small></div></article>}</section>
          <div class="tools"><label><app-icon name="search" [size]="21"/><input [value]="searchTerm()" (input)="search($any($event.target).value)" aria-label="Buscar reclamos" placeholder="Buscar por número, motivo, cliente o descripción..." /></label><button type="button" class="date-button" [class.active]="dateFilterActive()" aria-label="Filtrar por fecha" title="Filtrar por fecha" aria-haspopup="dialog" (click)="openDateModal()"><app-icon name="calendar-days" [size]="22"/>@if (dateFilterActive()) {<i aria-hidden="true"></i>}</button></div>
          <nav class="tabs"><button [class.active]="activeStatus() === 'todos'" (click)="showAll()">Todos</button><button [class.active]="activeStatus() === estados.RECIBIDOS" (click)="showReceived()">Recibidos</button><button [class.active]="activeStatus() === estados.EN_CURSO" (click)="showInProgress()">En curso</button><button [class.active]="activeStatus() === estados.FINALIZADO" (click)="showFinalized()">Finalizados</button></nav>
          @if (claims().length) {
            <div class="headings"><span>#</span><span>Reclamo</span><span>Cliente</span><span>Vendedor</span><span>Estado</span><span>Prioridad</span><span>Fecha</span><span>Acciones</span></div>
            <div class="claim-list">@for (claim of claims(); track claim.id) {
              <article class="claim" [class]="claim.estado" role="link" tabindex="0" (click)="open(claim)" (keydown.enter)="open(claim)" (keydown.space)="open(claim); $event.preventDefault()">
                <i class="rail"></i><strong class="number">{{ claim.numero }}</strong><div class="subject"><b>{{ claim.mtrDescri }}</b><span>{{ claim.descripcion }}</span></div><div class="client"><span><b>{{ client(claim) }}</b></span></div><div class="vendor"><span>{{ claim.vendedorNombre || "Sin vendedor" }}</span></div><span class="state">{{ statusLabel(claim.estado) }}</span><span class="priority" [class]="claim.prioridad"><i></i>{{ priorityLabel(claim.prioridad) }}</span><time><app-icon name="calendar-days" [size]="15"/><span>{{ displayDate(claim.fechaActualizacion) }}<small>{{ displayTime(claim.fechaActualizacion) }}</small></span></time><span class="actions">@if (auth.puedeGestionarReclamos()) {<button type="button" class="action-button action-priority" aria-label="Asignar prioridad" title="Asignar prioridad" (click)="openPriority(claim, $event)"><app-icon name="flag" [size]="20"/></button>}<button type="button" class="action-button action-detail" aria-label="Ver detalle del reclamo" title="Ver detalle" (click)="open(claim, $event)"><app-icon name="chevron-right" [size]="24"/></button></span>
                <div class="m-top"><span class="state">{{ statusLabel(claim.estado) }}</span><time>{{ displayDate(claim.fechaActualizacion) }}</time></div><div class="m-body"><div class="m-head"><strong>#{{ claim.numero }}</strong><span class="vendor-name">{{ claim.vendedorNombre || "Sin vendedor" }}</span></div><b>{{ claim.mtrDescri }}</b><span class="priority" [class]="claim.prioridad"><i></i>Prioridad {{ priorityLabel(claim.prioridad) }}</span><span class="description">{{ claim.descripcion }}</span><span class="client-name">Cliente: {{ client(claim) }}</span></div><div class="m-actions"><span class="responsible"><app-icon name="user-round" [size]="15"/>{{ claim.responsableNombre || claim.responsableId || 'Sin asignar' }}</span><span class="attachments"><app-icon name="paperclip" [size]="16"/>{{ attachmentCount(claim) }}</span><button type="button" aria-label="Ver detalle del reclamo" (click)="open(claim)"><app-icon name="chevron-right" [size]="27"/></button></div>
              </article>
            }</div>
          } @else {<section class="empty"><strong>Sin reclamos para mostrar</strong><span>Probá modificando la búsqueda o los filtros.</span></section>}
          @if (claims().length || page() > 0 || hasNextPage()) {
            <nav class="pagination" aria-label="Paginación de reclamos">
              <span>Mostrando {{ claims().length }} de {{ total() }} reclamos · Página {{ page() + 1 }}</span>
              <div>
                <button type="button" class="previous" aria-label="Página anterior" title="Página anterior" (click)="previousPage()" [disabled]="page() === 0 || loading()"><app-icon name="chevron-left" [size]="17" /></button>
                <button type="button" class="active" aria-current="page">{{ page() + 1 }}</button>
                <button type="button" class="next" aria-label="Página siguiente" title="Página siguiente" (click)="nextPage()" [disabled]="!hasNextPage() || loading()"><app-icon name="chevron-right" [size]="17" /></button>
              </div>
            </nav>
          }
        </section>
      </section>
    @if (dateModalOpen()) {<div class="priority-overlay" (click)="closeDateModal()"><section class="priority-modal date-modal" role="dialog" aria-modal="true" aria-labelledby="date-title" (click)="$event.stopPropagation()"><header><h2 id="date-title">Filtrar por fecha</h2><button type="button" aria-label="Cerrar" (click)="closeDateModal()"><app-icon name="x" [size]="21"/></button></header><div class="date-body"><div class="date-presets"><button type="button" (click)="setPreset('hoy')">Hoy</button><button type="button" (click)="setPreset('7')">Últimos 7 días</button><button type="button" (click)="setPreset('30')">Últimos 30 días</button><button type="button" (click)="setPreset('mes')">Este mes</button></div><div class="date-fields"><label class="date-field"><span>Desde</span><input type="date" [value]="draftFrom()" [max]="draftTo() || null" (change)="draftFrom.set($any($event.target).value)" /></label><label class="date-field"><span>Hasta</span><input type="date" [value]="draftTo()" [min]="draftFrom() || null" (change)="draftTo.set($any($event.target).value)" /></label></div></div><footer><button type="button" class="date-clear" (click)="clearDates()">Limpiar</button><button type="button" class="date-apply" (click)="applyDates()">Aplicar</button></footer></section></div>}
    @if (priorityModalOpen()) {<div class="priority-overlay" (click)="closePriorityModal()"><section class="priority-modal" role="dialog" aria-modal="true" aria-labelledby="priority-title" (click)="$event.stopPropagation()"><header><h2 id="priority-title">Asignar prioridad</h2><button type="button" aria-label="Cerrar" (click)="closePriorityModal()"><app-icon name="x" [size]="21"/></button></header><fieldset><legend>Seleccione la prioridad del reclamo</legend>@for (option of priorityOptions; track option.value) {<label><input type="radio" name="priority" [value]="option.value" [checked]="selectedPriority() === option.value" (change)="selectedPriority.set(option.value)"/><span>{{ option.label }}</span></label>}</fieldset><button class="priority-submit" type="button" [disabled]="prioritySaving()" (click)="assignPriority()">{{ prioritySaving() ? 'Asignando prioridad…' : 'Asignar prioridad' }}</button></section></div>}
    </main>
  `,
  styleUrl: './reclamos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamosComponent {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ReclamosService);
  private readonly notifications = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly estados = RECLAMO_ESTADOS;
  /** Reclamos acumulados durante la visita actual a la pantalla. */
  readonly all = signal<Reclamo[]>([]);
  /** Contenido de la página actual cuando no se está filtrando localmente. */
  readonly currentPageClaims = signal<Reclamo[]>([]);
  readonly searchTerm = signal('');
  readonly activeStatus = signal<StatusFilter>('todos');
  readonly routeStates = signal<EstadoReclamo[]>([]);
  /** Rango de fechas (yyyy-MM-dd, como entrega input[type=date]). Vacío = sin límite. */
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly dateModalOpen = signal(false);
  readonly draftFrom = signal('');
  readonly draftTo = signal('');
  readonly dateFilterActive = computed(() => !!this.dateFrom() || !!this.dateTo());
  readonly page = signal(0);
  readonly loading = signal(false);
  readonly hasNextPage = signal(false);
  readonly total = signal(0);
  readonly priorityModalOpen = signal(false);
  readonly prioritySaving = signal(false);
  readonly selectedPriority = signal<PrioridadReclamo>('media');
  readonly priorityClaim = signal<Reclamo | null>(null);
  readonly priorityOptions: { value: PrioridadReclamo; label: string }[] = [{ value: 'alta', label: 'ALTA' }, { value: 'media', label: 'MEDIA' }, { value: 'baja', label: 'BAJA' }];
  private readonly pageSize = 10;
  private requestId = 0;
  readonly statusOptions = [
    { value: RECLAMO_ESTADOS.RECIBIDOS, label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.RECIBIDOS] },
    { value: RECLAMO_ESTADOS.EN_CURSO, label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.EN_CURSO] },
    { value: RECLAMO_ESTADOS.FINALIZADO, label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.FINALIZADO] },
  ] as const;
  readonly filteredClaims = computed(() => this.all().filter(claim => {
    const term = this.searchTerm().trim().toLowerCase();
    const matchesRouteStates = !this.routeStates().length || this.routeStates().includes(claim.estado);
    return matchesRouteStates
      && this.inDateRange(claim.fechaActualizacion)
      && (this.activeStatus() === 'todos' || claim.estado === this.activeStatus())
      && (!term || [claim.numero, claim.asunto, claim.serDescri, claim.descripcion, this.client(claim)].join(' ').toLowerCase().includes(term));
  }));
  /** Los filtros y la búsqueda operan sobre todas las páginas visitadas. */
  readonly claims = computed(() => this.hasLocalFilter() ? this.filteredClaims() : this.currentPageClaims());
  readonly statusCounts = computed<ReclamosStatusCounts>(() => ({
    [RECLAMO_ESTADOS.RECIBIDOS]: this.countFor(RECLAMO_ESTADOS.RECIBIDOS),
    [RECLAMO_ESTADOS.EN_CURSO]: this.countFor(RECLAMO_ESTADOS.EN_CURSO),
    [RECLAMO_ESTADOS.FINALIZADO]: this.countFor(RECLAMO_ESTADOS.FINALIZADO),
  }));
  readonly priorityCounts = computed<ReclamosPriorityCounts>(() => ({ alta: this.priorityCount('alta'), media: this.priorityCount('media'), baja: this.priorityCount('baja') }));
  readonly summary = computed(() => {
    const list = this.all();
    return [{ label: 'Totales', count: this.total(), class: 'total', icon: 'clipboard-list', detail: 'Todos los reclamos' }, { label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.RECIBIDOS], count: list.filter(item => item.estado === RECLAMO_ESTADOS.RECIBIDOS).length, class: RECLAMO_ESTADOS.RECIBIDOS, icon: 'circle-alert', detail: 'Pendientes de atención' }, { label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.EN_CURSO], count: list.filter(item => item.estado === RECLAMO_ESTADOS.EN_CURSO).length, class: RECLAMO_ESTADOS.EN_CURSO, icon: 'square-chart-gantt', detail: 'En proceso de resolución' }, { label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.FINALIZADO], count: list.filter(item => item.estado === RECLAMO_ESTADOS.FINALIZADO).length, class: RECLAMO_ESTADOS.FINALIZADO, icon: 'check', detail: 'Resueltos' }];
  });
  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const states = (params.get('estados')?.split(',').filter(Boolean) ?? []) as EstadoReclamo[];
      this.routeStates.set(states);
      this.page.set(0);
      this.loadPage();
    });
  }
  search(value: string): void { this.searchTerm.set(value); }
  setStatus(status: StatusFilter): void { this.activeStatus.set(status); }
  openDateModal(): void { this.draftFrom.set(this.dateFrom()); this.draftTo.set(this.dateTo()); this.dateModalOpen.set(true); }
  setPreset(preset: 'hoy' | '7' | '30' | 'mes'): void {
    const today = new Date();
    const from = new Date(today);
    if (preset === '7') from.setDate(today.getDate() - 6);
    if (preset === '30') from.setDate(today.getDate() - 29);
    if (preset === 'mes') from.setDate(1);
    this.draftFrom.set(this.toInputDate(from));
    this.draftTo.set(this.toInputDate(today));
  }
  private toInputDate(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  closeDateModal(): void { this.dateModalOpen.set(false); }
  applyDates(): void { this.dateFrom.set(this.draftFrom()); this.dateTo.set(this.draftTo()); this.closeDateModal(); }
  clearDates(): void { this.dateFrom.set(''); this.dateTo.set(''); this.draftFrom.set(''); this.draftTo.set(''); this.closeDateModal(); }
  showAll(): void { this.setStatus('todos'); }
  showReceived(): void { this.setStatus(RECLAMO_ESTADOS.RECIBIDOS); }
  showInProgress(): void { this.setStatus(RECLAMO_ESTADOS.EN_CURSO); }
  showFinalized(): void { this.setStatus(RECLAMO_ESTADOS.FINALIZADO); }
  previousPage(): void { if (this.page() > 0) { this.page.update(page => page - 1); this.loadPage(); } }
  nextPage(): void { if (this.hasNextPage()) { this.page.update(page => page + 1); this.loadPage(); } }
  create(): void {
    if (!this.auth.puedeGestionarReclamos()) return;
    void this.router.navigateByUrl('/reclamos/nuevo');
  }
  logout(): void { this.auth.logout(); void this.router.navigateByUrl('/login'); }
  open(claim: Reclamo, event?: Event): void { event?.stopPropagation(); void this.router.navigate(['/reclamos', claim.id]); }
  openPriority(claim: Reclamo, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.auth.puedeGestionarReclamos()) return;
    this.priorityClaim.set(claim);
    this.selectedPriority.set(claim.prioridad);
    this.priorityModalOpen.set(true);
  }
  closePriorityModal(): void { this.priorityModalOpen.set(false); this.priorityClaim.set(null); }
  assignPriority(): void {
    const claim = this.priorityClaim();
    if (!claim || this.prioritySaving() || !this.auth.puedeGestionarReclamos()) return;
    const prioridad = this.selectedPriority();
    this.prioritySaving.set(true);
    this.service.asignarPrioridad(claim.id, prioridad).subscribe({
      next: () => {
        this.all.update(items => items.map(item => item.id === claim.id ? { ...item, prioridad } : item));
        this.currentPageClaims.update(items => items.map(item => item.id === claim.id ? { ...item, prioridad } : item));
        this.prioritySaving.set(false);
        this.closePriorityModal();
        void this.notifications.success('Prioridad asignada');
      },
      error: () => { this.prioritySaving.set(false); void this.notifications.error('No se pudo asignar la prioridad', 'Intentá nuevamente.'); },
    });
  }
  client(claim: Reclamo): string { return claim.clienteId || 'Sin identificación'; }
  countFor(status: EstadoReclamo): number { return this.all().filter(item => item.estado === status).length; }
  priorityCount(priority: Reclamo['prioridad']): number { return this.all().filter(item => item.prioridad === priority).length; }
  initials(value: string): string { return value.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'CL'; }
  attachmentCount(claim: Reclamo): number { return claim.archivos.length || 1; }
  statusLabel(status: EstadoReclamo): string { return RECLAMO_ESTADO_ETIQUETAS[status]; }
  priorityLabel(priority: Reclamo['prioridad']): string { return ({ alta: 'Alta', media: 'Media', baja: 'Baja' })[priority]; }
  displayDate(date: string): string { const value = new Date(date); return Number.isNaN(value.getTime()) ? '—' : new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(value); }
  displayTime(date: string): string { const value = new Date(date); return Number.isNaN(value.getTime()) ? '' : new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(value); }
  private loadPage(): void {
    const request = ++this.requestId;
    this.loading.set(true);
    const start = this.page() * this.pageSize;
    const query = { limit: String(this.pageSize), offset: String(start) };
    const pageRequest = this.auth.esOperador() ? this.service.misReclamos(query) : this.service.listarTodos(query);
    pageRequest.subscribe({
      next: result => {
        if (request !== this.requestId) return;
        // hasNext: true indica que el backend tiene más reclamos para la página siguiente.
        this.hasNextPage.set(result.hasNext);
        this.total.set(result.total);
        this.currentPageClaims.set(result.items);
        this.accumulate(result.items);
      },
      error: () => {
        if (request === this.requestId) {
          this.hasNextPage.set(false);
          this.loading.set(false);
        }
      },
      complete: () => { if (request === this.requestId) this.loading.set(false); },
    });
  }

  private hasLocalFilter(): boolean {
    return this.activeStatus() !== 'todos' || !!this.searchTerm().trim() || this.routeStates().length > 0 || !!this.dateFrom() || !!this.dateTo();
  }

  /** Compara por día calendario local, igual que la fecha que se muestra en cada tarjeta. */
  private inDateRange(date: string): boolean {
    const from = this.dateFrom();
    const to = this.dateTo();
    if (!from && !to) return true;
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return false;
    const day = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    return (!from || day >= from) && (!to || day <= to);
  }

  private accumulate(incoming: Reclamo[]): void {
    this.all.update(current => {
      const byId = new Map(current.map(claim => [claim.id, claim]));
      for (const claim of incoming) byId.set(claim.id, claim);
      return [...byId.values()];
    });
  }
}
