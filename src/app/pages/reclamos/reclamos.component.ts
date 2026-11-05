import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/Services/auth.service';
import { ReclamosService } from '../../core/Services/reclamos.service';
import { Reclamo } from '../../core/interfaces/models';
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
        <div><h1>Gestión de reclamos</h1><p>Gestioná y hacé seguimiento<br />de todos tus reclamos.</p></div>
        <aside aria-hidden="true"><i></i><b></b><b></b><b></b><b></b></aside><strong aria-hidden="true"><app-icon name="clipboard-list" [size]="38" /></strong>
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
              <button class="claim" [class]="claim.estado" type="button" (click)="open(claim)">
                <i class="rail"></i><strong class="number">{{ claim.numero }}</strong><div class="subject"><b>{{ claim.asunto }}</b><span>{{ claim.descripcion }}</span></div><div class="client"><i>{{ initials(client(claim)) }}</i><span><b>{{ client(claim) }}</b><small>ID: {{ claim.clienteId || '—' }}</small></span></div><span class="state">{{ statusLabel(claim.estado) }}</span><span class="priority" [class]="claim.prioridad"><i></i>{{ priorityLabel(claim.prioridad) }}</span><time><app-icon name="calendar-days" [size]="15"/><span>{{ displayDate(claim.fechaActualizacion) }}<small>{{ displayTime(claim.fechaActualizacion) }}</small></span></time><span class="actions" aria-label="Ver reclamo"><app-icon name="chevron-right" [size]="21"/></span>
                <div class="m-top"><span class="state">{{ statusLabel(claim.estado) }}</span><time>{{ displayDate(claim.fechaActualizacion) }}</time></div><div class="m-body"><strong>{{ claim.numero }}</strong><b>{{ claim.asunto }}</b><span>Cliente: {{ client(claim) }}</span><small><app-icon name="user-round" [size]="15"/>{{ claim.responsableId || 'Sin asignar' }}</small></div><div class="m-actions"><app-icon name="paperclip" [size]="16"/>{{ attachmentCount(claim) }} <app-icon name="chevron-right" [size]="27"/></div>
              </button>
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
    </main>
  `,
  styles: [`.pagination{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:24px 0 8px;color:#748098;font-size:13px}.pagination>div{display:flex;align-items:center;gap:5px}.pagination button{width:34px;height:34px;display:grid;place-items:center;border:1px solid #e0e7f0;border-radius:9px;background:#fff;color:#617089;font:800 13px var(--font-family);transition:.16s ease}.pagination button:not(:disabled){cursor:pointer}.pagination button:not(:disabled):hover{border-color:#ffdc1d;color:#0b1836;transform:translateY(-1px)}.pagination button.next:not(:disabled){border-color:#f2cc00;background:#fff8d7;color:#0b1836;box-shadow:0 3px 7px #d4ac171f}.pagination button.active{border-color:#ffdb1d;background:#ffdf35;color:#0b1836;box-shadow:0 3px 7px #d4ac171f}.pagination button:disabled{cursor:not-allowed;border-color:#e6ebf2;background:#f7f9fb;color:#b7c0ce;box-shadow:none;opacity:.72}.pagination-status{display:flex;align-items:center;gap:7px;margin-left:auto;color:#66758d;font-size:12px;font-weight:700}.pagination-status i{width:8px;height:8px;border-radius:50%;background:#aab5c4}.pagination-status.has-next{color:#4b6417}.pagination-status.has-next i{background:#78a018;box-shadow:0 0 0 4px #eef7da}.pagination-status.is-last{color:#758197}.pagination i{font-style:normal}@media(max-width:767px){.pagination{flex-wrap:wrap;margin:20px 0 8px}.pagination button{width:44px;height:44px}.pagination>span:first-child{display:none}.pagination-status{margin-left:0;font-size:11px}}`, `
    .claims-page{--navy:#071538;--line:#e2e8f0;min-height:100dvh;background:radial-gradient(circle at 80% 20%,#fff4bf,transparent 22%),#f6f8fb;color:var(--navy);font-family:var(--font-family)}.mobile-hero{display:none}.workspace{display:grid;grid-template-columns:282px minmax(0,1fr);gap:31px;max-width:1404px;margin:21px auto;padding:0 21px}.page-title{padding:9px 0 25px}.page-title p{margin:0 0 5px;color:#66728b;font-size:12px;font-weight:800}.page-title>div{display:flex;align-items:center;justify-content:space-between;gap:16px}.page-title h1{margin:0 0 5px;font-size:36px;line-height:1;letter-spacing:-.06em}.page-title span{color:#748098;font-size:15px}.page-title button{display:flex;align-items:center;gap:7px;border:0;border-radius:10px;padding:12px 16px;background:#ffdb1d;color:#0b1836;font:800 13px var(--font-family);white-space:nowrap}.summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-bottom:25px}.summary article{min-height:108px;display:flex;align-items:center;gap:16px;padding:15px;border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:0 3px 9px #263d6710}.summary article>i{width:67px;height:67px;display:grid;place-items:center;border-radius:13px;background:#f0f5fc;font-style:normal}.summary article div{display:grid;gap:2px}.summary b{font-size:26px;line-height:1}.summary strong{font-size:13px}.summary small{color:#8390a5;font-size:12px}.tools{display:grid;grid-template-columns:minmax(0,1fr) 185px 44px 44px;gap:9px;margin-bottom:16px}.tools>label{height:58px;display:flex;align-items:center;gap:14px;padding:0 15px;border:1px solid #e2e8f0;border-radius:12px;background:#fff}.tools input{min-width:0;flex:1;border:0;outline:0;font:500 14px var(--font-family)}.tools kbd{padding:3px 7px;border:1px solid #dce3ec;border-radius:6px;color:#8996a9;font-size:11px}.sort,.view{border:1px solid #dfe6ef;border-radius:11px;background:#fff;color:#152342;font:800 13px var(--font-family)}.sort{display:flex;align-items:center;justify-content:center;gap:7px}.sort app-icon:last-child{margin-left:auto}.view{display:grid;place-items:center}.view.active{border-color:#ffeb9a;background:#fff3bf}.mobile-filter,.tabs{display:none}.headings,.claim{display:grid;grid-template-columns:7% 25% 17% 12% 11% 15% 13%}.headings{padding:0 19px 10px;color:#66738b;font-size:11px;font-weight:800}.claim-list{display:grid;gap:9px}.claim{position:relative;align-items:center;min-height:80px;overflow:hidden;padding:10px 19px;border:1px solid #e6ebf2;border-radius:12px;background:#fff;color:var(--navy);text-align:left;box-shadow:0 3px 9px #263d6709}.rail{position:absolute;top:0;bottom:0;left:0;width:7px;background:#aab4c3}.number{font-size:20px}.subject{display:grid;gap:4px;padding-right:10px}.subject b{overflow:hidden;font-size:14px;text-overflow:ellipsis;white-space:nowrap}.subject span{display:-webkit-box;overflow:hidden;color:#718098;font-size:12px;line-height:1.3;-webkit-box-orient:vertical;-webkit-line-clamp:2}.client{display:flex;align-items:center;gap:9px}.client>i{width:39px;height:39px;display:grid;place-items:center;border-radius:50%;background:#e4efff;color:#1871ef;font-size:13px;font-style:normal}.client span{display:grid}.client b{font-size:12px}.client small{color:#78859b;font-size:11px}.state{justify-self:start;padding:8px 14px;border-radius:9px;background:#aab4c3;color:#fff;font-size:12px;font-weight:800;white-space:nowrap}.priority{justify-self:start;display:flex;align-items:center;gap:7px;padding:7px 12px;border-radius:99px;background:#f2f4f7;color:#66738b;font-size:12px}.priority i{width:8px;height:8px;border-radius:50%;background:#aeb7c5}.priority.alta{background:#ffeaec;color:#f33043}.priority.alta i{background:#f33043}.priority.media{background:#fff8dc;color:#bc8100}.priority.media i{background:#ffca00}.claim time{display:flex;align-items:center;gap:7px;color:#68768e;font-size:12px}.claim time span{display:grid}.claim time small{color:#7a879c;font-size:11px}.actions{display:flex;align-items:center;gap:12px;color:#68768e;white-space:nowrap}.m-top,.m-body,.m-actions{display:none}.empty{display:grid;justify-items:center;gap:7px;padding:70px;border:1px dashed #cdd6e3;border-radius:15px;color:#65738a}.empty strong{color:var(--navy);font-size:18px}
    @media(max-width:1150px) and (min-width:768px){.workspace{grid-template-columns:230px minmax(0,1fr);gap:18px}.summary article{gap:9px;padding:12px}.summary article>i{width:54px;height:54px}.client>i{display:none}.actions{font-size:14px}.claim,.headings{grid-template-columns:8% 25% 15% 13% 11% 16% 12%}}
    @media(max-width:767px){.claims-page{padding-bottom:calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));background:#f5f7fa}.mobile-hero{display:block;position:relative;overflow:hidden;padding:clamp(20px,6vw,32px) clamp(16px,5vw,24px) clamp(52px,15vw,68px);background:radial-gradient(circle at 21% 4%,#ffef7e,transparent 24%),linear-gradient(118deg,#ffdc19,#ffe046);clip-path:polygon(0 0,100% 0,100% 84%,70% 93%,40% 98%,0 94%)}.mobile-hero>div{max-width:calc(100% - 72px)}.mobile-hero h1{margin:0 0 6px;font-size:clamp(1.5rem,7vw,2rem);line-height:1.1;letter-spacing:-.03em}.mobile-hero p{margin:0;color:#27375b;font-size:clamp(.9375rem,4vw,1.0625rem);line-height:1.4;font-weight:600}.mobile-hero aside{display:none}.mobile-hero>strong{position:absolute;right:clamp(16px,5vw,24px);top:50%;width:52px;height:52px;margin-top:-34px;display:grid;place-items:center;border-radius:50%;background:#f4b300;color:#fff}.workspace{display:block;position:relative;z-index:1;margin:-28px 0 0;padding:0 max(12px,env(safe-area-inset-left)) 0 max(12px,env(safe-area-inset-right))}.page-title{display:none}.summary{gap:6px;margin-bottom:16px;padding:10px;border-radius:18px;background:#fff;box-shadow:0 3px 9px #263d6710}.summary article{min-width:0;min-height:92px;display:grid;justify-items:center;align-content:center;gap:4px;padding:10px 2px;text-align:center;box-shadow:none}.summary article>i{width:36px;height:36px;border-radius:50%}.summary b{font-size:1.375rem}.summary strong{font-size:.6875rem;font-weight:700}.summary small{display:none}.tools{display:flex;gap:8px;margin:0 0 14px}.tools>label{height:48px;flex:1;padding:0 14px;border-radius:14px}.tools input{font-size:16px}.mobile-filter{display:grid;flex:0 0 48px;height:48px;place-items:center;border:1px solid #e0e6ef;border-radius:14px;background:#fff}.tabs{display:flex;gap:4px;margin:0 0 14px;padding:4px;border-radius:16px;background:#edf0f5;overflow-x:auto;scrollbar-width:none;overscroll-behavior-x:contain}.tabs::-webkit-scrollbar{display:none}.tabs button{flex:1 0 auto;min-height:44px;padding:0 14px;border:0;border-radius:12px;background:transparent;color:#66738b;font:800 .8125rem var(--font-family);white-space:nowrap}.tabs button.active{background:linear-gradient(90deg,#ffda1d,#ffe561);color:#0b1836}.headings{display:none}.claim-list{gap:12px;margin:0}.claim{display:block;min-height:0;padding:14px 16px 14px 24px;border-radius:18px}.rail{width:7px}.claim>.number,.subject,.client,.claim>.state,.priority,.claim>time,.actions{display:none}.m-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.m-top time{display:block;color:#65738c;font-size:.75rem}.m-top .state{display:block;padding:6px 12px;font-size:.75rem}.m-body{display:grid;gap:4px;margin-top:12px}.m-body strong{font-size:1.125rem}.m-body>b{font-size:1rem;line-height:1.3;overflow-wrap:anywhere}.m-body>span,.m-body small{color:#60708b;font-size:.875rem;overflow-wrap:anywhere}.m-body small{display:flex;align-items:center;gap:4px}.m-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-top:8px;color:#66758e;font-size:.875rem}.empty{margin:0;padding:40px 16px}}
    @media(max-width:360px){.summary{padding:8px 6px}.summary article>i{display:none}.summary article{min-height:72px}}
  `, `.tools{grid-template-columns:minmax(0,1fr)}.summary .RECIBIDOS>i{background:#ffeaed;color:#f32f40}.summary .EN_CURSO>i{background:#fff4df;color:#f07800}.summary .FINALIZADO>i{background:#e4faef;color:#08a960}.summary .RECIBIDOS b,.summary .RECIBIDOS strong{color:#f32f40}.summary .EN_CURSO b,.summary .EN_CURSO strong{color:#f07800}.summary .FINALIZADO b,.summary .FINALIZADO strong{color:#08a960}.claim.RECIBIDOS .rail{background:#f63747}.claim.EN_CURSO .rail{background:#ff8600}.claim.FINALIZADO .rail{background:#10b96c}.claim.RECIBIDOS .state{background:#f33445}.claim.EN_CURSO .state{background:#ff8500}.claim.FINALIZADO .state{background:#0fb86d}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamosComponent {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ReclamosService);
  readonly auth = inject(AuthService);
  readonly estados = RECLAMO_ESTADOS;
  readonly all = signal<Reclamo[]>([]);
  readonly searchTerm = signal('');
  readonly activeStatus = signal<StatusFilter>('todos');
  readonly routeStates = signal<EstadoReclamo[]>([]);
  readonly page = signal(0);
  readonly loading = signal(false);
  readonly hasNextPage = signal(false);
  private readonly pageSize = 10;
  private requestId = 0;
  readonly statusOptions = [
    { value: RECLAMO_ESTADOS.RECIBIDOS, label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.RECIBIDOS] },
    { value: RECLAMO_ESTADOS.EN_CURSO, label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.EN_CURSO] },
    { value: RECLAMO_ESTADOS.FINALIZADO, label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.FINALIZADO] },
  ] as const;
  readonly claims = computed(() => this.all().filter(claim => {
    const term = this.searchTerm().trim().toLowerCase();
    return (this.activeStatus() === 'todos' || claim.estado === this.activeStatus()) && (!term || [claim.numero, claim.asunto, claim.descripcion, this.client(claim)].join(' ').toLowerCase().includes(term));
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
  open(claim: Reclamo): void { void this.router.navigate(['/reclamos', claim.id]); }
  client(claim: Reclamo): string { return claim.clienteId ? 'Cliente ' + claim.clienteId : 'Cliente sin identificación'; }
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
    this.service.list({ limit: String(this.pageSize + 1), offset: String(this.page() * this.pageSize) }).subscribe({
      next: claims => {
        if (request !== this.requestId) return;
        this.hasNextPage.set(claims.length > this.pageSize);
        const states = this.routeStates();
        const pageClaims = claims.slice(0, this.pageSize);
        this.all.set(states.length ? pageClaims.filter(claim => states.includes(claim.estado)) : pageClaims);
      },
      error: () => { if (request === this.requestId) { this.all.set([]); this.hasNextPage.set(false); this.loading.set(false); } },
      complete: () => { if (request === this.requestId) this.loading.set(false); },
    });
  }
}
