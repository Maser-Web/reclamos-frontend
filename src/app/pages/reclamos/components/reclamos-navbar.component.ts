import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Bell, ChevronLeft, FileText, LogOut, LucideAngularModule } from 'lucide-angular';
import { AvisosService } from '../../../core/Services/avisos.service';

@Component({
  selector: 'app-reclamos-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <header class="reclamos-navbar">
      <a class="brand-link" routerLink="/reclamos" aria-label="Ir a reclamos"><span class="maser-wordmark" aria-label="Maser LINK"><b>Maser</b><strong>LINK</strong></span></a>
      <nav aria-label="Navegación principal">
        <a routerLink="/reclamos" routerLinkActive="active">
          <lucide-icon [img]="fileIcon" [size]="18" [strokeWidth]="2.4" />
          Reclamos
        </a>
        <a routerLink="/notificaciones" routerLinkActive="active" [attr.aria-label]="'Notificaciones, '+avisos.pendientes()+' pendientes'">
          <span class="notification-link"><lucide-icon [img]="bellIcon" [size]="18" [strokeWidth]="2.4" />Notificaciones @if (avisos.pendientes()) {<b>{{ avisos.pendientes() > 99 ? '99+' : avisos.pendientes() }}</b>}</span>
        </a>
      </nav>
      <div class="user-actions">
        <span class="avatar" aria-hidden="true">{{ initials() }}</span>
        <strong>{{ usuarioNombre() || 'Usuario' }}</strong>
        <button type="button" class="logout-button" aria-label="Cerrar sesión" (click)="logoutRequested.emit()">
          <lucide-icon [img]="logoutIcon" [size]="21" [strokeWidth]="2.2" />
        </button>
      </div>
    </header>
    <!-- NAVBAR MÓVIL (comentado, no eliminado)
    <header class="mobile-navbar" [class.minimal]="minimalMobile()">
      <button type="button" class="mobile-back" [class.hidden]="!showBack()" (click)="back.emit()" aria-label="Volver"><lucide-icon [img]="backIcon" [size]="24" [strokeWidth]="2.4" /></button>
      <a class="mobile-brand" routerLink="/reclamos" aria-label="Ir al inicio"><span class="maser-wordmark" aria-label="Maser LINK"><b>Maser</b><strong>LINK</strong></span></a>
      <h1>{{ title() }}</h1>
      <button type="button" class="mobile-logout" aria-label="Cerrar sesión" (click)="logoutRequested.emit()"><lucide-icon [img]="logoutIcon" [size]="20" [strokeWidth]="2.2" /></button>
    </header> -->
  `,
  styleUrl: './reclamos-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamosNavbarComponent {
  readonly avisos = inject(AvisosService);
  readonly usuarioNombre = input<string | null>(null);
  readonly title = input('');
  readonly showBack = input(false);
  readonly minimalMobile = input(false);
  readonly logoutRequested = output<void>();
  readonly back = output<void>();
  readonly bellIcon = Bell;
  readonly fileIcon = FileText;
  readonly logoutIcon = LogOut;
  readonly backIcon = ChevronLeft;
  readonly initials = computed(() => {
    const name = this.usuarioNombre()?.trim();
    return name ? name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() : 'US';
  });
}
