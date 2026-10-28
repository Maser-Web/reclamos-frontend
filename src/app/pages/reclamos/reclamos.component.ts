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
        <img src="assets/logo.png" alt="Coronel" />
        <button type="button" aria-label="Cerrar sesión" (click)="logout()"><app-icon name="log-out" [size]="24" /></button>
        <div><h1>Reclamos</h1><p>Gestioná y hacé seguimiento<br />de todos tus reclamos.</p></div>
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
          <header class="page-title"><p>RECLAMOS</p><div><section><h1>Reclamos</h1><span>Gestioná y hacé seguimiento de todos los reclamos de clientes.</span></section><button type="button" (click)="create()"><app-icon name="plus" [size]="17" />Nuevo reclamo</button></div></header>
          <section class="summary">@for (item of summary(); track item.label) {<article [class]="item.class"><i><app-icon [name]="item.icon" [size]="28" /></i><div><b>{{ item.count }}</b><strong>{{ item.label }}</strong><small>{{ item.detail }}</small></div></article>}</section>
          <div class="tools"><label><app-icon name="search" [size]="21"/><input [value]="searchTerm()" (input)="search($any($event.target).value)" aria-label="Buscar reclamos" placeholder="Buscar por número, motivo, cliente o descripción..." /></label><button type="button" class="sort"><app-icon name="sliders-horizontal" [size]="16"/>Más recientes<app-icon name="chevron-down" [size]="15"/></button><button type="button" class="view active" aria-label="Vista de lista"><app-icon name="layout-list" [size]="20"/></button><button type="button" class="view" aria-label="Vista de cuadrícula"><app-icon name="grid-2x2" [size]="19"/></button><button type="button" class="mobile-filter" aria-label="Filtrar reclamos" (click)="goToFilters()"><app-icon name="list-filter" [size]="23"/></button></div>
          <nav class="tabs"><button [class.active]="activeStatus() === 'todos'" (click)="showAll()">Todos</button><button [class.active]="activeStatus() === estados.RECIBIDOS" (click)="showReceived()">Recibidos</button><button [class.active]="activeStatus() === estados.ASIGNADOS" (click)="showAssigned()">Asignados</button><button [class.active]="activeStatus() === estados.FINALIZADO" (click)="showFinalized()">Finalizados</button></nav>
          @if (claims().length) {
            <div class="headings"><span>#</span><span>Reclamo</span><span>Cliente</span><span>Estado</span><span>Prioridad</span><span>Fecha</span><span>Acciones</span></div>
            <div class="claim-list">@for (claim of claims(); track claim.id) {
              <button class="claim" [class]="claim.estado" type="button" (click)="open(claim)">
                <i class="rail"></i><strong class="number">{{ claim.numero }}</strong><div class="subject"><b>{{ claim.asunto }}</b><span>{{ claim.descripcion }}</span></div><div class="client"><i>{{ initials(client(claim)) }}</i><span><b>{{ client(claim) }}</b><small>ID: {{ claim.clienteId || '—' }}</small></span></div><span class="state">{{ statusLabel(claim.estado) }}</span><span class="priority" [class]="claim.prioridad"><i></i>{{ priorityLabel(claim.prioridad) }}</span><time><app-icon name="calendar-days" [size]="15"/><span>{{ displayDate(claim.fechaActualizacion) }}<small>{{ displayTime(claim.fechaActualizacion) }}</small></span></time><span class="actions"><app-icon name="paperclip" [size]="17"/><app-icon name="pencil" [size]="17"/><app-icon name="more-horizontal" [size]="19"/></span>
                <div class="m-top"><span class="state">{{ statusLabel(claim.estado) }}</span><time>{{ displayDate(claim.fechaActualizacion) }}</time></div><div class="m-body"><strong>{{ claim.numero }}</strong><b>{{ claim.asunto }}</b><span>Cliente: {{ client(claim) }}</span><small><app-icon name="user-round" [size]="15"/>{{ claim.responsableId || 'Sin asignar' }}</small></div><div class="m-actions"><app-icon name="paperclip" [size]="16"/>{{ attachmentCount(claim) }} <app-icon name="chevron-right" [size]="27"/></div>
              </button>
            }</div>
          } @else {<section class="empty"><strong>Sin reclamos para mostrar</strong><span>Probá modificando la búsqueda o los filtros.</span></section>}
        </section>
      </section>
    </main>
  `,
  styles: [`
    .claims-page{--navy:#071538;--line:#e2e8f0;min-height:100dvh;background:radial-gradient(circle at 80% 20%,#fff4bf,transparent 22%),#f6f8fb;color:var(--navy);font-family:var(--font-family)}.mobile-hero{display:none}.workspace{display:grid;grid-template-columns:282px minmax(0,1fr);gap:31px;max-width:1404px;margin:21px auto;padding:0 21px}.page-title{padding:9px 0 25px}.page-title p{margin:0 0 5px;color:#66728b;font-size:12px;font-weight:800}.page-title>div{display:flex;align-items:center;justify-content:space-between;gap:16px}.page-title h1{margin:0 0 5px;font-size:36px;line-height:1;letter-spacing:-.06em}.page-title span{color:#748098;font-size:15px}.page-title button{display:flex;align-items:center;gap:7px;border:0;border-radius:10px;padding:12px 16px;background:#ffdb1d;color:#0b1836;font:800 13px var(--font-family);white-space:nowrap}.summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-bottom:25px}.summary article{min-height:108px;display:flex;align-items:center;gap:16px;padding:15px;border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:0 3px 9px #263d6710}.summary article>i{width:67px;height:67px;display:grid;place-items:center;border-radius:13px;background:#f0f5fc;font-style:normal}.summary article div{display:grid;gap:2px}.summary b{font-size:26px;line-height:1}.summary strong{font-size:13px}.summary small{color:#8390a5;font-size:12px}.tools{display:grid;grid-template-columns:minmax(0,1fr) 185px 44px 44px;gap:9px;margin-bottom:16px}.tools>label{height:58px;display:flex;align-items:center;gap:14px;padding:0 15px;border:1px solid #e2e8f0;border-radius:12px;background:#fff}.tools input{min-width:0;flex:1;border:0;outline:0;font:500 14px var(--font-family)}.tools kbd{padding:3px 7px;border:1px solid #dce3ec;border-radius:6px;color:#8996a9;font-size:11px}.sort,.view{border:1px solid #dfe6ef;border-radius:11px;background:#fff;color:#152342;font:800 13px var(--font-family)}.sort{display:flex;align-items:center;justify-content:center;gap:7px}.sort app-icon:last-child{margin-left:auto}.view{display:grid;place-items:center}.view.active{border-color:#ffeb9a;background:#fff3bf}.mobile-filter,.tabs{display:none}.headings,.claim{display:grid;grid-template-columns:7% 25% 17% 12% 11% 15% 13%}.headings{padding:0 19px 10px;color:#66738b;font-size:11px;font-weight:800}.claim-list{display:grid;gap:9px}.claim{position:relative;align-items:center;min-height:80px;overflow:hidden;padding:10px 19px;border:1px solid #e6ebf2;border-radius:12px;background:#fff;color:var(--navy);text-align:left;box-shadow:0 3px 9px #263d6709}.rail{position:absolute;top:0;bottom:0;left:0;width:7px;background:#aab4c3}.number{font-size:20px}.subject{display:grid;gap:4px;padding-right:10px}.subject b{overflow:hidden;font-size:14px;text-overflow:ellipsis;white-space:nowrap}.subject span{display:-webkit-box;overflow:hidden;color:#718098;font-size:12px;line-height:1.3;-webkit-box-orient:vertical;-webkit-line-clamp:2}.client{display:flex;align-items:center;gap:9px}.client>i{width:39px;height:39px;display:grid;place-items:center;border-radius:50%;background:#e4efff;color:#1871ef;font-size:13px;font-style:normal}.client span{display:grid}.client b{font-size:12px}.client small{color:#78859b;font-size:11px}.state{justify-self:start;padding:8px 14px;border-radius:9px;background:#aab4c3;color:#fff;font-size:12px;font-weight:800;white-space:nowrap}.priority{justify-self:start;display:flex;align-items:center;gap:7px;padding:7px 12px;border-radius:99px;background:#f2f4f7;color:#66738b;font-size:12px}.priority i{width:8px;height:8px;border-radius:50%;background:#aeb7c5}.priority.alta{background:#ffeaec;color:#f33043}.priority.alta i{background:#f33043}.priority.media{background:#fff8dc;color:#bc8100}.priority.media i{background:#ffca00}.claim time{display:flex;align-items:center;gap:7px;color:#68768e;font-size:12px}.claim time span{display:grid}.claim time small{color:#7a879c;font-size:11px}.actions{display:flex;align-items:center;gap:12px;color:#68768e;white-space:nowrap}.m-top,.m-body,.m-actions{display:none}.empty{display:grid;justify-items:center;gap:7px;padding:70px;border:1px dashed #cdd6e3;border-radius:15px;color:#65738a}.empty strong{color:var(--navy);font-size:18px}
    @media(max-width:1150px) and (min-width:768px){.workspace{grid-template-columns:230px minmax(0,1fr);gap:18px}.summary article{gap:9px;padding:12px}.summary article>i{width:54px;height:54px}.client>i{display:none}.actions{font-size:14px}.claim,.headings{grid-template-columns:8% 25% 15% 13% 11% 16% 12%}}
    @media(max-width:767px){.claims-page{padding-bottom:calc(78px + env(safe-area-inset-bottom));background:#f5f7fa}.mobile-hero{height:420px;display:block;position:relative;overflow:hidden;padding:63px 10.5% 0;background:radial-gradient(circle at 21% 4%,#ffef7e,transparent 24%),linear-gradient(118deg,#ffdc19,#ffe046);clip-path:polygon(0 0,100% 0,100% 60%,72% 77%,52% 91%,32% 99%,0 92%)}.mobile-hero>img{width:119px}.mobile-hero>button{position:absolute;top:47px;right:10%;width:59px;height:59px;border:0;border-radius:50%;background:#fff5c9;color:#0a1736;font-size:28px}.mobile-hero>div{margin-top:53px}.mobile-hero h1{margin:0 0 9px;font-size:55px;line-height:1}.mobile-hero p{margin:0;color:#27375b;font-size:23px;line-height:1.45;font-weight:600}.mobile-hero aside{position:absolute;right:38px;top:209px;width:117px;height:157px;padding:30px 21px;border-radius:17px;background:#fffdf0;box-shadow:0 13px 20px #b58c252b;transform:rotate(-8deg)}.mobile-hero aside i{display:block;width:74px;height:14px;margin:0 0 14px;border-radius:99px;background:#ffe45a}.mobile-hero aside b{display:block;width:70px;height:10px;margin:0 0 12px;border-radius:99px;background:#ffe276}.mobile-hero>strong{position:absolute;right:-5px;top:282px;width:86px;height:86px;display:grid;place-items:center;border-radius:50%;background:#f4b300;color:#fff;font-size:38px}.workspace{display:block;position:relative;z-index:1;margin:-60px 0 0;padding:0 14px}.page-title{display:none}.summary{gap:9px;margin-bottom:28px;padding:17px 10px 13px;border-radius:22px 22px 0 0;background:#fff}.summary article{min-width:0;min-height:144px;display:grid;justify-items:center;gap:10px;padding:19px 4px;text-align:center}.summary article>i{width:54px;height:54px;border-radius:50%;font-size:26px}.summary b{font-size:28px}.summary strong{font-size:14px;font-weight:600}.summary small{display:none}.tools{display:flex;gap:12px;margin:0 16px 29px}.tools>label{height:61px;flex:1;padding:0 18px;border-radius:16px}.tools input{font-size:17px}.tools kbd,.sort,.view{display:none}.mobile-filter{display:grid;flex:0 0 61px;place-items:center;border:1px solid #e0e6ef;border-radius:16px;background:#fff;font-size:24px}.tabs{display:grid;grid-template-columns:repeat(4,1fr);margin:0 16px 27px;border-radius:19px;background:#edf0f5;overflow:hidden}.tabs button{height:67px;border:0;background:transparent;color:#66738b;font:800 15px var(--font-family)}.tabs button.active{border-radius:18px;background:linear-gradient(90deg,#ffda1d,#ffe561);color:#0b1836}.headings{display:none}.claim-list{gap:20px;margin:0 16px}.claim{display:block;min-height:264px;padding:19px 24px 22px 42px;border-radius:24px}.rail{width:11px}.claim>.number,.subject,.client,.claim>.state,.priority,.claim>time,.actions{display:none}.m-top{display:flex;align-items:center;justify-content:space-between}.m-top time{display:block;color:#65738c;font-size:15px}.m-top .state{display:block;padding:10px 18px;font-size:15px}.m-body{display:grid;gap:7px;margin-top:25px}.m-body strong{font-size:28px}.m-body>b{font-size:19px}.m-body>span,.m-body small{color:#60708b;font-size:16px}.m-actions{position:absolute;right:25px;bottom:28px;display:flex;gap:24px;color:#66758e;font-size:17px}.m-actions b{font-size:43px;font-weight:400}.empty{margin:0 16px}}
    @media(max-width:480px){.mobile-hero{height:357px;padding-top:48px}.mobile-hero>img{width:90px}.mobile-hero>button{top:35px;width:49px;height:49px}.mobile-hero>div{margin-top:36px}.mobile-hero h1{font-size:41px}.mobile-hero p{font-size:18px}.mobile-hero aside{top:165px;right:22px;transform:rotate(-8deg) scale(.77);transform-origin:top right}.mobile-hero>strong{top:227px;right:-15px;transform:scale(.77)}.workspace{margin-top:-48px;padding:0 8px}.summary{gap:6px;padding:12px 7px 10px}.summary article{min-height:111px;gap:7px;padding:13px 2px}.summary article>i{width:42px;height:42px;font-size:20px}.summary b{font-size:22px}.summary strong{font-size:11px}.tools{gap:9px;margin:0 9px 19px}.tools>label{height:51px;padding:0 14px}.tools input{font-size:14px}.mobile-filter{flex-basis:51px}.tabs{margin:0 9px 19px}.tabs button{height:55px;font-size:12px}.claim-list{gap:14px;margin:0 9px}.claim{min-height:207px;padding:15px 18px 18px 33px;border-radius:18px}.rail{width:8px}.m-top .state{padding:8px 13px;font-size:12px}.m-top time{font-size:12px}.m-body{gap:5px;margin-top:17px}.m-body strong{font-size:23px}.m-body>b{font-size:16px}.m-body>span,.m-body small{font-size:13px}.m-actions{right:19px;bottom:21px;font-size:13px}.m-actions b{font-size:33px}}
  `, `.summary .RECIBIDOS>i{background:#ffeaed;color:#f32f40}.summary .ASIGNADOS>i{background:#fff4df;color:#f07800}.summary .FINALIZADO>i{background:#e4faef;color:#08a960}.summary .RECIBIDOS b,.summary .RECIBIDOS strong{color:#f32f40}.summary .ASIGNADOS b,.summary .ASIGNADOS strong{color:#f07800}.summary .FINALIZADO b,.summary .FINALIZADO strong{color:#08a960}.claim.RECIBIDOS .rail{background:#f63747}.claim.ASIGNADOS .rail{background:#ff8600}.claim.FINALIZADO .rail{background:#10b96c}.claim.RECIBIDOS .state{background:#f33445}.claim.ASIGNADOS .state{background:#ff8500}.claim.FINALIZADO .state{background:#0fb86d}`],
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
  readonly statusOptions = [
    { value: RECLAMO_ESTADOS.RECIBIDOS, label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.RECIBIDOS] },
    { value: RECLAMO_ESTADOS.ASIGNADOS, label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.ASIGNADOS] },
    { value: RECLAMO_ESTADOS.FINALIZADO, label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.FINALIZADO] },
  ] as const;
  readonly claims = computed(() => this.all().filter(claim => {
    const term = this.searchTerm().trim().toLowerCase();
    return (this.activeStatus() === 'todos' || claim.estado === this.activeStatus()) && (!term || [claim.numero, claim.asunto, claim.descripcion, this.client(claim)].join(' ').toLowerCase().includes(term));
  }));
  readonly statusCounts = computed<ReclamosStatusCounts>(() => ({
    [RECLAMO_ESTADOS.RECIBIDOS]: this.countFor(RECLAMO_ESTADOS.RECIBIDOS),
    [RECLAMO_ESTADOS.ASIGNADOS]: this.countFor(RECLAMO_ESTADOS.ASIGNADOS),
    [RECLAMO_ESTADOS.FINALIZADO]: this.countFor(RECLAMO_ESTADOS.FINALIZADO),
  }));
  readonly priorityCounts = computed<ReclamosPriorityCounts>(() => ({ alta: this.priorityCount('alta'), media: this.priorityCount('media'), baja: this.priorityCount('baja') }));
  readonly summary = computed(() => {
    const list = this.all();
    return [{ label: 'Totales', count: list.length, class: 'total', icon: 'clipboard-list', detail: 'Todos los reclamos' }, { label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.RECIBIDOS], count: list.filter(item => item.estado === RECLAMO_ESTADOS.RECIBIDOS).length, class: RECLAMO_ESTADOS.RECIBIDOS, icon: 'file-stack', detail: 'Pendientes de asignar' }, { label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.ASIGNADOS], count: list.filter(item => item.estado === RECLAMO_ESTADOS.ASIGNADOS).length, class: RECLAMO_ESTADOS.ASIGNADOS, icon: 'square-chart-gantt', detail: 'En proceso de resolución' }, { label: RECLAMO_ESTADO_ETIQUETAS[RECLAMO_ESTADOS.FINALIZADO], count: list.filter(item => item.estado === RECLAMO_ESTADOS.FINALIZADO).length, class: RECLAMO_ESTADOS.FINALIZADO, icon: 'check', detail: 'Resueltos' }];
  });
  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const userId = this.auth.usuarioCodigo();
      if (userId === null) { this.all.set([]); return; }
      this.service.byUsuario(String(userId)).subscribe({
        next: claims => { const states = (params.get('estados')?.split(',').filter(Boolean) ?? []) as EstadoReclamo[]; this.all.set(states.length ? claims.filter(claim => states.includes(claim.estado)) : claims); },
        error: () => this.all.set([]),
      });
    });
  }
  search(value: string): void { this.searchTerm.set(value); }
  setStatus(status: StatusFilter): void { this.activeStatus.set(status); }
  showAll(): void { this.setStatus('todos'); }
  showReceived(): void { this.setStatus(RECLAMO_ESTADOS.RECIBIDOS); }
  showAssigned(): void { this.setStatus(RECLAMO_ESTADOS.ASIGNADOS); }
  showFinalized(): void { this.setStatus(RECLAMO_ESTADOS.FINALIZADO); }
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
}
