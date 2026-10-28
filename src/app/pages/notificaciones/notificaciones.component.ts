import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/Services/auth.service';
import { AppIconComponent } from '../../core/components/ui';
import { ReclamosNavbarComponent } from '../reclamos/components/reclamos-navbar.component';

type NotificationKind = 'asignacion' | 'comentario' | 'estado' | 'sistema';
type NotificationFilter = 'todas' | NotificationKind;

type ClaimNotification = {
  id: number;
  kind: NotificationKind;
  title: string;
  message: string;
  location?: string;
  time: string;
  unread: boolean;
};

@Component({
  standalone: true,
  imports: [AppIconComponent, ReclamosNavbarComponent],
  template: `
    <app-reclamos-navbar [usuarioNombre]="auth.usuarioNombre()" (logoutRequested)="logout()" />
    <main class="notifications-page">
      <section class="notifications-shell">
        <header class="notifications-header">
          <div><h1>Notificaciones</h1><p>Enterate de las novedades relacionadas a los reclamos.</p></div>
          <button type="button" class="read-all" (click)="markAllAsRead()"><app-icon name="check" [size]="17"/>Marcar todas como leídas</button>
        </header>

        <nav class="notification-tabs" aria-label="Filtros de notificaciones">
          @for (tab of tabs; track tab.value) {
            <button type="button" [class.active]="filter() === tab.value" (click)="filter.set(tab.value)">{{ tab.label }} @if (count(tab.value)) {<b>{{ count(tab.value) }}</b>}</button>
          }
        </nav>

        <section class="notification-list" aria-live="polite">
          @for (notification of visibleNotifications(); track notification.id) {
            <article class="notification-card" [class.unread]="notification.unread">
              <span class="unread-dot" aria-hidden="true"></span>
              <span class="notification-type" [class]="notification.kind"><app-icon [name]="iconFor(notification.kind)" [size]="21"/></span>
              <div class="notification-copy">
                <strong>{{ notification.title }}</strong>
                <p>{{ notification.message }}</p>
                @if (notification.location) {<small><app-icon name="map-pin" [size]="13"/>{{ notification.location }}</small>}
              </div>
              <time>{{ notification.time }}</time>
              <button type="button" class="more-button" [attr.aria-label]="'Más opciones para ' + notification.title"><app-icon name="more-horizontal" [size]="20"/></button>
              <app-icon name="chevron-right" [size]="19" class="mobile-chevron"/>
            </article>
          } @empty {
            <section class="empty-notifications"><app-icon name="check-circle" [size]="38"/><strong>No hay novedades por revisar</strong><span>Las nuevas actualizaciones de tus reclamos aparecerán aquí.</span></section>
          }
        </section>
      </section>
    </main>
  `,
  styles: `
    .notifications-page{min-height:100dvh;padding:36px 24px 54px;border-top:3px solid var(--color-primary);background:radial-gradient(circle at 10% 0,#fff6c9,transparent 23%),#f5f7fa;color:#101a35}.notifications-shell{width:min(100%,900px);margin:auto}.notifications-header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:0 4px 20px;border-bottom:1px solid #dbe2eb}.notifications-header h1{margin:0 0 4px;font-size:24px;letter-spacing:-.045em}.notifications-header p{margin:0;color:#60708a;font-size:13px}.read-all{display:flex;align-items:center;gap:8px;min-height:38px;padding:0 15px;border:0;border-radius:11px;background:#fff;color:#17213b;box-shadow:0 4px 14px rgb(33 50 76 / 7%);font:800 12px var(--font-family);white-space:nowrap}.read-all app-icon{color:#c59f00}.notification-tabs{display:flex;gap:8px;padding:14px 0}.notification-tabs button{min-width:116px;height:34px;padding:0 13px;border:0;border-radius:99px;background:transparent;color:#637087;font:700 11px var(--font-family);white-space:nowrap}.notification-tabs button.active{background:var(--color-primary);color:#101a35;box-shadow:0 4px 9px rgb(211 174 0 / 20%)}.notification-tabs b{display:inline-grid;place-items:center;min-width:15px;height:15px;margin-left:3px;padding:0 4px;border-radius:99px;background:#dbe1e9;color:#506078;font-size:9px}.notification-tabs .active b{background:#101a35;color:#fff}.notification-list{display:grid;gap:9px}.notification-card{position:relative;display:grid;grid-template-columns:48px minmax(0,1fr) 70px 28px;align-items:center;gap:14px;min-height:68px;padding:12px 14px 12px 31px;border:1px solid transparent;border-radius:14px;background:rgb(255 255 255 / 80%);box-shadow:0 5px 17px rgb(34 49 77 / 4%)}.notification-card.unread{border-color:#fff0b4;background:linear-gradient(100deg,#fffdf6,#fff7d9)}.unread-dot{position:absolute;left:10px;top:18px;width:9px;height:9px;border-radius:50%;background:#fa2635}.notification-card:not(.unread) .unread-dot{display:none}.notification-type{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;color:#fff}.notification-type.asignacion{background:linear-gradient(145deg,#ffdc1c,#f4c600);color:#17213b}.notification-type.comentario{background:#1768ec}.notification-type.estado{background:#15ba71}.notification-type.sistema{background:#718198}.notification-copy{display:grid;min-width:0;gap:2px}.notification-copy strong{font-size:13px;line-height:1.25}.notification-copy p{overflow:hidden;margin:0;color:#4f607d;font-size:12px;line-height:1.3;text-overflow:ellipsis;white-space:nowrap}.notification-copy small{display:flex;align-items:center;gap:4px;color:#53647e;font-size:11px}.notification-card time{align-self:start;padding-top:3px;color:#53647a;font-size:11px;white-space:nowrap}.more-button{align-self:start;width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:#304461}.more-button:hover{background:#eef2f7}.mobile-chevron{display:none}.empty-notifications{display:grid;justify-items:center;gap:8px;padding:68px 24px;border:1px dashed #cbd5e1;border-radius:16px;color:#62728b;text-align:center}.empty-notifications app-icon{color:#14ad69}.empty-notifications strong{color:#17213b}.empty-notifications span{font-size:13px}
    @media(max-width:767px){.notifications-page{padding:0 0 122px;border:0;background:#f6f8fb}.notifications-shell{width:100%}.notifications-header{min-height:76px;align-items:center;padding:0 24px;border:0;background:linear-gradient(105deg,#ffdf20,#ffd400)}.notifications-header h1{margin:0;font-size:15px;text-align:center}.notifications-header p,.read-all{display:none}.notifications-header>div{width:100%}.notification-tabs{gap:0;padding:8px 12px 7px;border-bottom:1px solid #e2e7ee;background:#fff}.notification-tabs button{flex:1;min-width:0;height:30px;padding:0 4px;font-size:10px}.notification-tabs button:nth-child(n+4){display:none}.notification-tabs button.active{border-radius:16px}.notification-list{gap:6px;padding:8px 10px}.notification-card{grid-template-columns:42px minmax(0,1fr) 42px 16px;gap:9px;min-height:72px;padding:10px 7px 10px 17px;border-radius:11px;box-shadow:0 3px 10px rgb(34 49 77 / 4%)}.unread-dot{left:7px;top:17px;width:7px;height:7px}.notification-type{width:36px;height:36px}.notification-copy{gap:2px}.notification-copy strong{font-size:11px}.notification-copy p{font-size:10px;white-space:normal}.notification-copy small{font-size:9px}.notification-card time{padding-top:1px;font-size:10px}.more-button{display:none}.mobile-chevron{display:block;color:#64738b}.empty-notifications{margin:8px;padding:45px 20px}.empty-notifications span{font-size:12px}}
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionesComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly filter = signal<NotificationFilter>('todas');
  readonly notifications = signal<ClaimNotification[]>([
    { id: 1, kind: 'asignacion', title: 'Se te asignó un nuevo reclamo', message: 'Se te asignó el reclamo #245 - Alumbrado público.', location: 'B° Centro, Villa María', time: 'Hace 10 min', unread: true },
    { id: 2, kind: 'asignacion', title: 'Se te asignó un nuevo reclamo', message: 'Se te asignó el reclamo #233 - Bache en la calle.', location: 'B° Carlos Pellegrini, Villa María', time: 'Hace 1 hora', unread: true },
    { id: 3, kind: 'comentario', title: 'Nuevo comentario en un reclamo', message: 'Se agregó un comentario en el reclamo #228.', time: 'Hace 2 horas', unread: false },
    { id: 4, kind: 'estado', title: 'Cambio de estado', message: 'El reclamo #221 cambió su estado a En gestión.', time: 'Hace 3 horas', unread: false },
    { id: 5, kind: 'sistema', title: 'Actualización del sistema', message: 'Se realizaron mejoras en el módulo de reclamos.', time: 'Hace 1 día', unread: false },
  ]);
  readonly tabs: ReadonlyArray<{ value: NotificationFilter; label: string }> = [
    { value: 'todas', label: 'Todas' }, { value: 'asignacion', label: 'Asignaciones' }, { value: 'comentario', label: 'Comentarios' }, { value: 'estado', label: 'Cambios de estado' }, { value: 'sistema', label: 'Sistema' },
  ];
  readonly visibleNotifications = computed(() => this.filter() === 'todas' ? this.notifications() : this.notifications().filter(item => item.kind === this.filter()));

  count(filter: NotificationFilter): number {
    return this.notifications().filter(item => item.unread && (filter === 'todas' || item.kind === filter)).length;
  }

  markAllAsRead(): void { this.notifications.update(items => items.map(item => ({ ...item, unread: false }))); }

  logout(): void { this.auth.logout(); void this.router.navigateByUrl('/login'); }

  iconFor(kind: NotificationKind): string {
    return ({ asignacion: 'user-round', comentario: 'message-circle', estado: 'check', sistema: 'settings' })[kind];
  }
}
