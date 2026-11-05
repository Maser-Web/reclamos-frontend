import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, ClipboardList, FileText, FileStack, Grid2X2, Home, LayoutList, ListFilter, LogOut, MapPin, Menu, MessageCircle, MoreHorizontal, Paperclip, Pencil, Plus, Search, Settings, SlidersHorizontal, SquareChartGantt, UserRound, X } from 'lucide-angular';
import { LucideIconData } from 'lucide-angular';
import { Reclamo } from '../interfaces/models';
import { EstadoReclamo, RECLAMO_ESTADO_ETIQUETAS } from '../constants/reclamo-estados';
import { AuthService } from '../Services/auth.service';
import { AvisosService } from '../Services/avisos.service';
import { ReclamosNavbarComponent } from '../../pages/reclamos/components/reclamos-navbar.component';

const ICONS: Record<string, LucideIconData> = { bell: Bell, 'calendar-days': CalendarDays, check: Check, 'check-circle': CircleCheck, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, 'circle-alert': CircleAlert, 'clipboard-list': ClipboardList, 'file-stack': FileStack, 'file-text': FileText, 'grid-2x2': Grid2X2, home: Home, 'layout-list': LayoutList, 'list-filter': ListFilter, 'log-out': LogOut, 'map-pin': MapPin, menu: Menu, 'message-circle': MessageCircle, 'more-horizontal': MoreHorizontal, paperclip: Paperclip, pencil: Pencil, plus: Plus, search: Search, settings: Settings, 'sliders-horizontal': SlidersHorizontal, 'square-chart-gantt': SquareChartGantt, 'user-round': UserRound, x: X };
@Component({ selector: 'app-icon', imports: [LucideAngularModule], template: '<lucide-icon [img]="icon()" [size]="size()" [strokeWidth]="2.4"/>', changeDetection: ChangeDetectionStrategy.OnPush })
export class AppIconComponent { name = input.required<string>(); size = input(22); icon = computed(() => ICONS[this.name()] ?? FileText); }
@Component({ selector: 'app-header', imports: [ReclamosNavbarComponent], template: `<app-reclamos-navbar [title]="title()" [showBack]="showBack()" [usuarioNombre]="usuarioNombre()" (back)="back.emit()" (logoutRequested)="logout()"/>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class AppHeaderComponent { private readonly auth=inject(AuthService); private readonly router=inject(Router); title = input.required<string>(); showBack = input(false); showMenu = input(false); back = output<void>(); menu = output<void>(); readonly usuarioNombre=this.auth.usuarioNombre; logout():void{this.auth.logout();void this.router.navigateByUrl('/login');} }
@Component({ selector: 'app-status-badge', template: `<span class="badge" [class]="'badge '+status()">{{label}}</span>`, styleUrl: './ui-status-badge.scss' ,changeDetection: ChangeDetectionStrategy.OnPush })
export class StatusBadgeComponent { status = input.required<EstadoReclamo>(); get label(){ return RECLAMO_ESTADO_ETIQUETAS[this.status()]; } }
@Component({ selector: 'app-button', imports: [AppIconComponent], template: `<button [type]="type()" class="app-button" [class.secondary]="variant()==='secondary'" [class.success]="variant()==='success'" [disabled]="disabled()">@if(icon()){<app-icon [name]="icon()!"/>}<span>{{label()}}</span></button>`, styleUrl: './ui-button.scss' ,changeDetection: ChangeDetectionStrategy.OnPush })
export class AppButtonComponent { label=input.required<string>(); icon=input<string>(); type=input<'button'|'submit'>('button'); variant=input<'primary'|'secondary'|'success'>('primary'); disabled=input(false); }
@Component({ selector: 'app-reclamo-card', imports: [StatusBadgeComponent, AppIconComponent], template: `<button class="claim-card" (click)="selected.emit(reclamo())"><i [class]="reclamo().estado"></i><div><app-status-badge [status]="reclamo().estado"/><strong>{{reclamo().numero}}</strong><h2>{{reclamo().asunto}}</h2><p>Cliente: {{cliente()}}</p><small>{{area()}}</small></div><app-icon name="chevron-right"/></button>`, styleUrl: './ui-reclamo-card.scss' ,changeDetection: ChangeDetectionStrategy.OnPush })
export class ReclamoCardComponent { reclamo=input.required<Reclamo>(); cliente=input.required<string>(); area=input('Sin asignar'); selected=output<Reclamo>(); }
@Component({ selector: 'app-empty-state', imports: [AppIconComponent], template: `<section class="empty"><app-icon name="clipboard-list" [size]="42"/><h2>{{title()}}</h2><p>{{message()}}</p></section>`, styleUrl: './ui-empty-state.scss' ,changeDetection: ChangeDetectionStrategy.OnPush })
export class EmptyStateComponent { title=input('Sin resultados'); message=input('No encontramos reclamos para mostrar.'); }
@Component({ selector: 'app-summary-card', template: '<article class="summary-card"><b [class]="tone()">{{value()}}</b><span>{{label()}}</span></article>', styleUrl: './ui-summary-card.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class SummaryCardComponent { label=input.required<string>(); value=input.required<number>(); tone=input(''); }
@Component({ selector: 'app-loading-state', template: '<section class="loading" role="status">Cargando reclamos…</section>', styleUrl: './ui-loading-state.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class LoadingStateComponent {}
@Component({ selector: 'app-file-upload', template: '<label class="upload">Adjuntar archivos<input type="file" multiple (change)="selected.emit($any($event.target).files)"/></label>', styleUrl: './ui-file-upload.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class FileUploadComponent { selected=output<FileList | null>(); }
@Component({ selector: 'app-confirm-dialog', template: '@if(open()){<div class="overlay" role="dialog"><section><h2>{{title()}}</h2><p>{{message()}}</p><button (click)="cancelled.emit()">Cancelar</button><button (click)="confirmed.emit()">Confirmar</button></section></div>}', styleUrl: './ui-confirm-dialog.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ConfirmDialogComponent { open=input(false); title=input('Confirmar acción'); message=input('¿Desea continuar?'); confirmed=output<void>(); cancelled=output<void>(); }
@Component({
  selector: 'app-bottom-navigation',
  imports: [RouterLink, RouterLinkActive, AppIconComponent],
  template: `<nav class="bottom-nav" aria-label="Navegación principal">
    <a class="nav-item" routerLink="/reclamos" routerLinkActive="active"><app-icon name="clipboard-list" [size]="24"/><span>Reclamos</span></a>
    <a class="create-link" routerLink="/reclamos/nuevo" routerLinkActive="active"><span class="create-icon"><app-icon name="plus" [size]="31"/></span><span>Crear</span></a>
    <a class="nav-item notification" routerLink="/notificaciones" routerLinkActive="active" [attr.aria-label]="'Notificaciones, '+avisos.pendientes()+' pendientes'"><span class="notification-icon"><app-icon name="bell" [size]="25"/>@if (avisos.pendientes()) {<b>{{ avisos.pendientes() > 99 ? '99+' : avisos.pendientes() }}</b>}</span><span>Notificaciones</span></a>
  </nav>`,
  styleUrl: './ui-bottom-navigation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavigationComponent {
  readonly avisos = inject(AvisosService);
}
