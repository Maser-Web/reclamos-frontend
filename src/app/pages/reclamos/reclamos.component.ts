import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, Subject, switchMap } from 'rxjs';
import { AuthService } from '../../core/Services/auth.service';
import { RECLAMOS_PAGE_SIZE, ReclamosPaginados, ReclamosPaginaRequest, ReclamosService } from '../../core/Services/reclamos.service';
import { ReclamosPageCacheService } from '../../core/Services/reclamos-page-cache.service';
import { NotificationService } from '../../core/Services/notification.service';
import { PrioridadReclamo, Reclamo } from '../../core/interfaces/models';
import { EstadoReclamo, RECLAMO_ESTADOS, RECLAMO_ESTADOS_LISTA, RECLAMO_ESTADO_ETIQUETAS } from '../../core/constants/reclamo-estados';
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
          (statusChanged)="toggleStatus($event)"
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
          } @else if (loading()) {<section class="empty" aria-live="polite"><strong>Cargando reclamos…</strong></section>
          } @else if (loadError()) {<section class="empty" role="alert"><strong>No se pudieron cargar los reclamos</strong><span>Intentá nuevamente en unos segundos.</span></section>
          } @else {<section class="empty"><strong>Sin reclamos para mostrar</strong><span>Probá modificando la búsqueda o los filtros.</span></section>}
          @if (pageClaims().length || page() > 0 || hasNextPage()) {
            <nav class="pagination" aria-label="Paginación de reclamos">
              <span>@if (pageClaims().length) {Mostrando {{ offset() + 1 }}–{{ offset() + pageClaims().length }} · }Página {{ page() + 1 }}</span>
              <div>
                <button type="button" class="previous" aria-label="Página anterior" title="Página anterior" (click)="previousPage()" [disabled]="offset() === 0 || loading()"><app-icon name="chevron-left" [size]="17" /></button>
                <button type="button" class="active" aria-current="page">{{ page() + 1 }}</button>
                <button type="button" class="next" aria-label="Página siguiente" title="Página siguiente" (click)="nextPage()" [disabled]="!hasNextPage() || loading()"><app-icon name="chevron-right" [size]="17" /></button>
              </div>
            </nav>
          }
        </section>
      </section>
    @if (dateModalOpen()) {<div class="priority-overlay" (click)="closeDateModal()"><section class="priority-modal date-modal" role="dialog" aria-modal="true" aria-labelledby="date-title" (click)="$event.stopPropagation()"><header><h2 id="date-title">Filtrar por fecha</h2><button type="button" aria-label="Cerrar" (click)="closeDateModal()"><app-icon name="x" [size]="21"/></button></header><div class="date-body"><div class="date-presets"><button type="button" (click)="setPreset('hoy')">Hoy</button><button type="button" (click)="setPreset('7')">Últimos 7 días</button><button type="button" (click)="setPreset('30')">Últimos 30 días</button></div><div class="date-fields"><label class="date-field"><span>Desde</span><input type="date" [value]="draftFrom()" [max]="draftTo() || null" (change)="draftFrom.set($any($event.target).value)" /></label><label class="date-field"><span>Hasta</span><input type="date" [value]="draftTo()" [min]="draftFrom() || null" (change)="draftTo.set($any($event.target).value)" /></label></div></div><footer><button type="button" class="date-clear" (click)="clearDates()">Limpiar</button><button type="button" class="date-apply" (click)="applyDates()">Aplicar</button></footer></section></div>}
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
  private readonly cache = inject(ReclamosPageCacheService);
  private readonly notifications = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly estados = RECLAMO_ESTADOS;
  /** Reclamos de la página actual tal como los devolvió el backend (máximo 10). */
  readonly pageClaims = signal<Reclamo[]>([]);
  readonly searchTerm = signal('');
  readonly activeStatus = signal<StatusFilter>('todos');
  /** Rango de fechas (yyyy-MM-dd, como entrega input[type=date]). Vacío = sin límite. */
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly dateModalOpen = signal(false);
  readonly draftFrom = signal('');
  readonly draftTo = signal('');
  readonly dateFilterActive = computed(() => !!this.dateFrom() || !!this.dateTo());
  /** Posición inicial de la página actual; siempre múltiplo de RECLAMOS_PAGE_SIZE. */
  readonly offset = signal(0);
  readonly page = computed(() => Math.floor(this.offset() / RECLAMOS_PAGE_SIZE));
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly hasNextPage = signal(false);
  readonly priorityModalOpen = signal(false);
  readonly prioritySaving = signal(false);
  readonly selectedPriority = signal<PrioridadReclamo>('media');
  readonly priorityClaim = signal<Reclamo | null>(null);
  readonly priorityOptions: { value: PrioridadReclamo; label: string }[] = [{ value: 'alta', label: 'ALTA' }, { value: 'media', label: 'MEDIA' }, { value: 'baja', label: 'BAJA' }];
  /** Cada emisión cancela (switchMap) la request anterior que siga pendiente. */
  private readonly pageRequests = new Subject<ReclamosPaginaRequest>();
  readonly statusOptions = [
    { value: RECLAMO_ESTADOS.RECIBIDOS, label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.RECIBIDOS] },
    { value: RECLAMO_ESTADOS.EN_CURSO, label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.EN_CURSO] },
    { value: RECLAMO_ESTADOS.FINALIZADO, label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.FINALIZADO] },
  ] as const;
  /**
   * El estado lo filtra el backend. La búsqueda y el rango de fechas no tienen soporte en la API,
   * así que solo acotan los reclamos de la página visible.
   */
  readonly claims = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    return this.pageClaims().filter(claim => this.inDateRange(claim.fechaActualizacion)
      && (!term || [claim.numero, claim.asunto, claim.serDescri, claim.descripcion, this.client(claim)].join(' ').toLowerCase().includes(term)));
  });
  /**
   * Reclamos vistos durante la visita (sin repetir id), acumulados a medida que se recorren páginas.
   * Solo alimentan los contadores; la grilla siempre muestra la página remota (`pageClaims`).
   */
  readonly all = signal<Reclamo[]>([]);
  readonly summary = computed(() => {
    const list = this.all();
    return [
      { label: 'Totales', count: list.length, class: 'total', icon: 'clipboard-list', detail: 'Todos los reclamos' },
      { label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.RECIBIDOS], count: this.countFor(RECLAMO_ESTADOS.RECIBIDOS), class: RECLAMO_ESTADOS.RECIBIDOS, icon: 'circle-alert', detail: 'Pendientes de atención' },
      { label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.EN_CURSO], count: this.countFor(RECLAMO_ESTADOS.EN_CURSO), class: RECLAMO_ESTADOS.EN_CURSO, icon: 'square-chart-gantt', detail: 'En proceso de resolución' },
      { label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.FINALIZADO], count: this.countFor(RECLAMO_ESTADOS.FINALIZADO), class: RECLAMO_ESTADOS.FINALIZADO, icon: 'check', detail: 'Resueltos' },
    ];
  });
  readonly statusCounts = computed<ReclamosStatusCounts>(() => ({
    [RECLAMO_ESTADOS.RECIBIDOS]: this.countFor(RECLAMO_ESTADOS.RECIBIDOS),
    [RECLAMO_ESTADOS.EN_CURSO]: this.countFor(RECLAMO_ESTADOS.EN_CURSO),
    [RECLAMO_ESTADOS.FINALIZADO]: this.countFor(RECLAMO_ESTADOS.FINALIZADO),
  }));
  readonly priorityCounts = computed<ReclamosPriorityCounts>(() => ({ alta: this.priorityCount('alta'), media: this.priorityCount('media'), baja: this.priorityCount('baja') }));
  constructor() {
    this.pageRequests.pipe(
      switchMap(request => this.service.pagina(request).pipe(
        map(result => ({ request, result: result as ReclamosPaginados | null })),
        catchError(() => of({ request, result: null })),
      )),
      takeUntilDestroyed(),
    ).subscribe(({ request, result }) => this.applyPage(request, result));

    // Una invalidación (crear/derivar/cambiar estado) recarga la vista si pudo verse afectada.
    this.cache.invalidaciones$.pipe(takeUntilDestroyed()).subscribe(estados => {
      if (estados === null || estados.has(this.currentRequest().estado ?? 'TODOS')) this.loadPage();
    });

    // /reclamos?estados=EN_CURSO selecciona ese filtro; la API admite un único estado por consulta.
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const states = (params.get('estados')?.split(',').filter(Boolean) ?? [])
        .filter((state): state is EstadoReclamo => RECLAMO_ESTADOS_LISTA.includes(state as EstadoReclamo));
      this.applyFilter(states.length === 1 ? states[0] : 'todos');
    });
  }
  search(value: string): void { this.searchTerm.set(value); }
  setStatus(status: StatusFilter): void { if (status !== this.activeStatus()) this.applyFilter(status); }
  /** En el panel lateral, desmarcar el estado activo vuelve a “Todos”. */
  toggleStatus(status: EstadoReclamo): void { this.setStatus(this.activeStatus() === status ? 'todos' : status); }
  openDateModal(): void { this.draftFrom.set(this.dateFrom()); this.draftTo.set(this.dateTo()); this.dateModalOpen.set(true); }
  setPreset(preset: 'hoy' | '7' | '30'): void {
    const today = new Date();
    const from = new Date(today);
    if (preset === '7') from.setDate(today.getDate() - 6);
    if (preset === '30') from.setDate(today.getDate() - 29);
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
  previousPage(): void {
    if (this.offset() === 0 || this.loading()) return;
    this.offset.update(offset => Math.max(0, offset - RECLAMOS_PAGE_SIZE));
    this.loadPage();
  }
  nextPage(): void {
    if (this.hasNextPage() !== true || this.loading()) return;
    this.offset.update(offset => offset + RECLAMOS_PAGE_SIZE);
    this.loadPage();
  }
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
        this.pageClaims.update(items => items.map(item => item.id === claim.id ? { ...item, prioridad } : item));
        this.prioritySaving.set(false);
        this.closePriorityModal();
        void this.notifications.success('Prioridad asignada');
      },
      error: () => { this.prioritySaving.set(false); void this.notifications.error('No se pudo asignar la prioridad', 'Intentá nuevamente.'); },
    });
  }
  client(claim: Reclamo): string { return claim.clienteId || 'Sin identificación'; }
  initials(value: string): string { return value.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'CL'; }
  attachmentCount(claim: Reclamo): number { return claim.archivos.length || 1; }
  statusLabel(status: EstadoReclamo): string { return RECLAMO_ESTADO_ETIQUETAS[status]; }
  priorityLabel(priority: Reclamo['prioridad']): string { return ({ alta: 'Alta', media: 'Media', baja: 'Baja' })[priority]; }
  displayDate(date: string): string { const value = new Date(date); return Number.isNaN(value.getTime()) ? '—' : new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(value); }
  displayTime(date: string): string { const value = new Date(date); return Number.isNaN(value.getTime()) ? '' : new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(value); }
  /** Cambio de filtro: nueva consulta desde offset 0, sin mezclar reclamos del filtro anterior. */
  private applyFilter(status: StatusFilter): void {
    this.activeStatus.set(status);
    this.offset.set(0);
    this.pageClaims.set([]);
    this.hasNextPage.set(false);
    this.loadPage();
  }

  private currentRequest(): ReclamosPaginaRequest {
    const status = this.activeStatus();
    return {
      rol: this.service.rolActual(),
      estado: this.service.estadoFiltro(status === 'todos' ? null : status),
      limit: RECLAMOS_PAGE_SIZE,
      offset: this.offset(),
    };
  }

  private loadPage(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.pageRequests.next(this.currentRequest());
  }

  /** Solo la respuesta que coincide con rol, estado y offset actuales puede actualizar la grilla. */
  private applyPage(request: ReclamosPaginaRequest, result: ReclamosPaginados | null): void {
    const current = this.currentRequest();
    if (request.rol !== current.rol || request.estado !== current.estado || request.offset !== current.offset) return;
    this.loading.set(false);
    if (!result) {
      this.loadError.set(true);
      this.hasNextPage.set(false);
      this.pageClaims.set([]);
      return;
    }
    this.hasNextPage.set(result.hasNext);
    this.pageClaims.set(result.items);
    this.accumulate(result.items);
  }

  /** Agrega o reemplaza por id: un reclamo recargado con otro estado actualiza los contadores. */
  private accumulate(incoming: Reclamo[]): void {
    this.all.update(current => {
      const byId = new Map(current.map(claim => [claim.id, claim]));
      for (const claim of incoming) byId.set(claim.id, claim);
      return [...byId.values()];
    });
  }

  private countFor(status: EstadoReclamo): number { return this.all().filter(item => item.estado === status).length; }
  private priorityCount(priority: PrioridadReclamo): number { return this.all().filter(item => item.prioridad === priority).length; }

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
}
