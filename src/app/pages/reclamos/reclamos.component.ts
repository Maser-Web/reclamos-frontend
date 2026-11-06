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
    <main class="claims-page">
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
          <div class="tools"><label><app-icon name="search" [size]="21"/><input [value]="searchTerm()" (input)="search($any($event.target).value)" aria-label="Buscar reclamos" placeholder="Buscar por número, motivo, cliente o descripción..." /></label><button type="button" class="mobile-filter" aria-label="Filtrar reclamos" (click)="goToFilters()"><app-icon name="list-filter" [size]="23"/></button></div>
          <nav class="tabs"><button [class.active]="activeStatus() === 'todos'" (click)="showAll()">Todos</button><button [class.active]="activeStatus() === estados.RECIBIDOS" (click)="showReceived()">Recibidos</button><button [class.active]="activeStatus() === estados.EN_CURSO" (click)="showInProgress()">En curso</button><button [class.active]="activeStatus() === estados.FINALIZADO" (click)="showFinalized()">Finalizados</button></nav>
          @if (claims().length) {
            <div class="headings"><span>#</span><span>Reclamo</span><span>Cliente</span><span>Estado</span><span>Prioridad</span><span>Fecha</span><span>Acciones</span></div>
            <div class="claim-list">@for (claim of claims(); track claim.id) {
              <article class="claim" [class]="claim.estado" role="link" tabindex="0" (click)="open(claim)" (keydown.enter)="open(claim)" (keydown.space)="open(claim); $event.preventDefault()">
                <i class="rail"></i><strong class="number">{{ claim.numero }}</strong><div class="subject"><b>{{ claim.serDescri }}</b><span>{{ claim.descripcion }}</span></div><div class="client"><span><b>{{ client(claim) }}</b></span></div><span class="state">{{ statusLabel(claim.estado) }}</span><span class="priority" [class]="claim.prioridad"><i></i>{{ priorityLabel(claim.prioridad) }}</span><time><app-icon name="calendar-days" [size]="15"/><span>{{ displayDate(claim.fechaActualizacion) }}<small>{{ displayTime(claim.fechaActualizacion) }}</small></span></time><span class="actions"><button type="button" class="action-button action-priority" aria-label="Asignar prioridad" title="Asignar prioridad" (click)="openPriority(claim, $event)"><app-icon name="flag" [size]="20"/></button><button type="button" class="action-button action-detail" aria-label="Ver detalle del reclamo" title="Ver detalle" (click)="open(claim, $event)"><app-icon name="chevron-right" [size]="24"/></button></span>
                <div class="m-top"><span class="state">{{ statusLabel(claim.estado) }}</span><time>{{ displayDate(claim.fechaActualizacion) }}</time></div><div class="m-body"><strong>Número de reclamo #{{ claim.numero }}</strong><b>{{ claim.serDescri }}</b><span class="priority" [class]="claim.prioridad"><i></i>Prioridad {{ priorityLabel(claim.prioridad) }}</span><span class="description">{{ claim.descripcion }}</span><span class="client-name">Cliente: {{ client(claim) }}</span></div><div class="m-actions"><span class="responsible"><app-icon name="user-round" [size]="15"/>{{ claim.responsableNombre || claim.responsableId || 'Sin asignar' }}</span><span class="attachments"><app-icon name="paperclip" [size]="16"/>{{ attachmentCount(claim) }}</span><button type="button" aria-label="Ver detalle del reclamo" (click)="open(claim)"><app-icon name="chevron-right" [size]="27"/></button></div>
              </article>
            }</div>
            <nav class="pagination" aria-label="Paginación de reclamos">
              <span>Mostrando {{ claims().length }} reclamos · Página {{ page() + 1 }}</span>
              <span class="pagination-status" [class.has-next]="hasNextPage()" [class.is-last]="!hasNextPage()" aria-live="polite"><i aria-hidden="true"></i>{{ paginationMessage() }}</span>
              <div>
                <button type="button" class="previous" aria-label="Página anterior" title="Página anterior" (click)="previousPage()" [disabled]="page() === 0 || loading()"><app-icon name="chevron-left" [size]="17" /></button>
                <button type="button" class="active" aria-current="page">{{ page() + 1 }}</button>
                <button type="button" class="next" aria-label="Página siguiente" title="Página siguiente" (click)="nextPage()" [disabled]="!hasNextPage() || loading()"><app-icon name="chevron-right" [size]="17" /></button>
              </div>
            </nav>
          } @else {<section class="empty"><strong>Sin reclamos para mostrar</strong><span>Probá modificando la búsqueda o los filtros.</span></section>}
        </section>
      </section>
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
  readonly all = signal<Reclamo[]>([]);
  readonly searchTerm = signal('');
  readonly activeStatus = signal<StatusFilter>('todos');
  readonly routeStates = signal<EstadoReclamo[]>([]);
  readonly page = signal(0);
  readonly loading = signal(false);
  readonly hasNextPage = signal(false);
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
  readonly claims = computed(() => this.all().filter(claim => {
    const term = this.searchTerm().trim().toLowerCase();
    return (this.activeStatus() === 'todos' || claim.estado === this.activeStatus()) && (!term || [claim.numero, claim.asunto, claim.serDescri, claim.descripcion, this.client(claim)].join(' ').toLowerCase().includes(term));
  }));
  readonly paginationMessage = computed(() => {
    if (this.loading()) return 'Consultando páginas...';
    return this.hasNextPage() ? 'Hay más reclamos para ver' : 'Última página';
  });
  readonly statusCounts = computed<ReclamosStatusCounts>(() => ({
    [RECLAMO_ESTADOS.RECIBIDOS]: this.countFor(RECLAMO_ESTADOS.RECIBIDOS),
    [RECLAMO_ESTADOS.EN_CURSO]: this.countFor(RECLAMO_ESTADOS.EN_CURSO),
    [RECLAMO_ESTADOS.FINALIZADO]: this.countFor(RECLAMO_ESTADOS.FINALIZADO),
  }));
  readonly priorityCounts = computed<ReclamosPriorityCounts>(() => ({ alta: this.priorityCount('alta'), media: this.priorityCount('media'), baja: this.priorityCount('baja') }));
  readonly summary = computed(() => {
    const list = this.all();
    return [{ label: 'Totales', count: list.length, class: 'total', icon: 'clipboard-list', detail: 'Todos los reclamos' }, { label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.RECIBIDOS], count: list.filter(item => item.estado === RECLAMO_ESTADOS.RECIBIDOS).length, class: RECLAMO_ESTADOS.RECIBIDOS, icon: 'file-stack', detail: 'Pendientes de asignar' }, { label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.EN_CURSO], count: list.filter(item => item.estado === RECLAMO_ESTADOS.EN_CURSO).length, class: RECLAMO_ESTADOS.EN_CURSO, icon: 'square-chart-gantt', detail: 'En proceso de resolución' }, { label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.FINALIZADO], count: list.filter(item => item.estado === RECLAMO_ESTADOS.FINALIZADO).length, class: RECLAMO_ESTADOS.FINALIZADO, icon: 'check', detail: 'Resueltos' }];
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
  showAll(): void { this.setStatus('todos'); }
  showReceived(): void { this.setStatus(RECLAMO_ESTADOS.RECIBIDOS); }
  showInProgress(): void { this.setStatus(RECLAMO_ESTADOS.EN_CURSO); }
  showFinalized(): void { this.setStatus(RECLAMO_ESTADOS.FINALIZADO); }
  previousPage(): void { if (this.page() > 0) { this.page.update(page => page - 1); this.loadPage(); } }
  nextPage(): void { if (this.hasNextPage()) { this.page.update(page => page + 1); this.loadPage(); } }
  create(): void { void this.router.navigateByUrl('/reclamos/nuevo'); }
  logout(): void { this.auth.logout(); void this.router.navigateByUrl('/login'); }
  goToFilters(): void { void this.router.navigate(['/reclamos/filtros']); }
  open(claim: Reclamo, event?: Event): void { event?.stopPropagation(); void this.router.navigate(['/reclamos', claim.id]); }
  openPriority(claim: Reclamo, event: MouseEvent): void { event.stopPropagation(); this.priorityClaim.set(claim); this.selectedPriority.set(claim.prioridad); this.priorityModalOpen.set(true); }
  closePriorityModal(): void { this.priorityModalOpen.set(false); this.priorityClaim.set(null); }
  assignPriority(): void {
    const claim = this.priorityClaim();
    if (!claim || this.prioritySaving()) return;
    const prioridad = this.selectedPriority();
    this.prioritySaving.set(true);
    this.service.asignarPrioridad(claim.id, prioridad).subscribe({
      next: () => { this.all.update(items => items.map(item => item.id === claim.id ? { ...item, prioridad } : item)); this.prioritySaving.set(false); this.closePriorityModal(); void this.notifications.success('Prioridad asignada'); },
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
    // Se solicita un registro adicional para confirmar si existe una página siguiente.
    this.service.misReclamos().subscribe({
      next: claims => {
        if (request !== this.requestId) return;
        const start = this.page() * this.pageSize;
        this.hasNextPage.set(claims.length > start + this.pageSize);
        const states = this.routeStates();
        const pageClaims = claims.slice(start, start + this.pageSize);
        this.all.set(states.length ? pageClaims.filter(claim => states.includes(claim.estado)) : pageClaims);
      },
      error: () => { if (request === this.requestId) { this.all.set([]); this.hasNextPage.set(false); this.loading.set(false); } },
      complete: () => { if (request === this.requestId) this.loading.set(false); },
    });
  }
}
