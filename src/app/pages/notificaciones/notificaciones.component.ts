import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AvisosService } from '../../core/Services/avisos.service';
import { AuthService } from '../../core/Services/auth.service';
import { NotificationService } from '../../core/Services/notification.service';
import { Aviso } from '../../core/interfaces/aviso.interface';
import { AppIconComponent } from '../../core/components/ui';
import { ReclamosNavbarComponent } from '../reclamos/components/reclamos-navbar.component';

type NotificationFilter = 'todas' | 'pendientes' | 'leidas';

@Component({
  standalone: true,
  imports: [AppIconComponent, ReclamosNavbarComponent],
  template: `
    <app-reclamos-navbar [usuarioNombre]="auth.usuarioNombre()" (logoutRequested)="logout()" />
    <main class="notifications-page">
      <section class="notifications-shell">
        <header class="notifications-header">
          <div><h1>Notificaciones</h1><p>Enterate de las novedades relacionadas a los reclamos.</p></div>
          @if (avisos.pendientes()) {
            <button type="button" class="read-all" (click)="markAllAsRead()"><app-icon name="check" [size]="17"/>Marcar todas como leídas</button>
          }
        </header>

        <nav class="notification-tabs" aria-label="Filtros de notificaciones">
          @for (tab of tabs; track tab.value) {
            <button type="button" [class.active]="filter() === tab.value" (click)="filter.set(tab.value)">
              {{ tab.label }} @if (count(tab.value)) {<b>{{ count(tab.value) }}</b>}
            </button>
          }
        </nav>

        @if (loading() && avisos.avisos().length === 0) {
          <section class="empty-notifications" role="status"><app-icon name="bell" [size]="38"/><strong>Cargando avisos</strong><span>Un momento, por favor.</span></section>
        } @else if (loadError() && avisos.avisos().length === 0) {
          <section class="empty-notifications load-error" role="alert"><app-icon name="circle-alert" [size]="38"/><strong>No se pudieron cargar los avisos</strong><button type="button" (click)="loadAvisos()">Reintentar</button></section>
        } @else {
          <section class="notification-list" aria-live="polite" [attr.aria-busy]="loading()">
            @for (aviso of visibleAvisos(); track aviso.aviCod) {
              <button
                type="button"
                class="notification-card"
                [class.unread]="isPending(aviso)"
                [disabled]="marking().has(aviso.aviCod)"
                [attr.aria-label]="cardLabel(aviso)"
                (click)="openAviso(aviso)">
                <span class="unread-dot" aria-hidden="true"></span>
                <span class="notification-type"><app-icon name="bell" [size]="21"/></span>
                <span class="notification-copy">
                  <strong>{{ aviso.aviTitulo ?? 'Aviso' }}</strong>
                  <span>{{ aviso.aviDescri ?? 'Sin descripción' }}</span>
                  @if (isPending(aviso)) {<small>Pendiente de lectura</small>}
                </span>
                <time>{{ aviso.aviFecha ?? 'Fecha no disponible' }}</time>
                <app-icon name="chevron-right" [size]="19" class="mobile-chevron"/>
              </button>
            } @empty {
              <section class="empty-notifications"><app-icon name="check-circle" [size]="38"/><strong>{{ emptyTitle() }}</strong><span>{{ emptyMessage() }}</span></section>
            }
          </section>
        }
      </section>
    </main>
  `,
  styleUrl: './notificaciones.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionesComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly avisos = inject(AvisosService);
  readonly filter = signal<NotificationFilter>('todas');
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly marking = signal<ReadonlySet<number>>(new Set());
  readonly tabs: ReadonlyArray<{ value: NotificationFilter; label: string }> = [
    { value: 'todas', label: 'Todas' },
    { value: 'pendientes', label: 'Pendientes' },
    { value: 'leidas', label: 'Leídas' },
  ];
  readonly visibleAvisos = computed(() => {
    const avisos = this.avisos.avisos();
    if (this.filter() === 'pendientes') return avisos.filter(aviso => this.isPending(aviso));
    if (this.filter() === 'leidas') return avisos.filter(aviso => aviso.aviVisto === true);
    return avisos;
  });

  constructor() {
    this.loadAvisos();
  }

  count(filter: NotificationFilter): number {
    if (filter === 'leidas') return this.avisos.avisos().filter(aviso => aviso.aviVisto === true).length;
    return this.avisos.pendientes();
  }

  isPending(aviso: Aviso): boolean {
    return aviso.aviVisto !== true;
  }

  cardLabel(aviso: Aviso): string {
    const title = aviso.aviTitulo ?? 'Aviso';
    return this.isPending(aviso) ? `${title}. Seleccionar para marcar como leído.` : title;
  }

  emptyTitle(): string {
    return this.filter() === 'leidas' ? 'Todavía no hay avisos leídos' : 'No hay novedades por revisar';
  }

  emptyMessage(): string {
    return this.filter() === 'leidas'
      ? 'Los avisos que leas aparecerán en esta lista.'
      : 'Las nuevas actualizaciones aparecerán aquí.';
  }

  loadAvisos(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.avisos.consultarAvisos().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      error: error => {
        this.loadError.set(this.avisos.avisos().length === 0);
        void this.feedback.error('No se pudieron cargar los avisos', this.errorMessage(error));
      },
    });
  }

  openAviso(aviso: Aviso): void {
    if (!this.isPending(aviso) || this.marking().has(aviso.aviCod)) return;
    this.setMarking(aviso.aviCod, true);
    this.avisos.marcarComoLeido(aviso.aviCod).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.setMarking(aviso.aviCod, false)),
    ).subscribe({
      error: error => void this.feedback.error('No se pudo marcar como leído', this.errorMessage(error)),
    });
  }

  markAllAsRead(): void {
    for (const aviso of this.avisos.avisos()) {
      if (this.isPending(aviso)) this.openAviso(aviso);
    }
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  private setMarking(aviCod: number, marking: boolean): void {
    this.marking.update(current => {
      const next = new Set(current);
      if (marking) next.add(aviCod);
      else next.delete(aviCod);
      return next;
    });
  }

  private errorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const body = error.error;
      if (typeof body === 'object' && body !== null && 'mensaje' in body && typeof body.mensaje === 'string') {
        return body.mensaje;
      }
    }
    return error instanceof Error ? error.message : 'Intentá nuevamente.';
  }
}
