import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Bell, FileText, LogOut, LucideAngularModule } from 'lucide-angular';
import { AvisosService } from '../../../core/Services/avisos.service';

@Component({
  selector: 'app-reclamos-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <header class="reclamos-navbar">
      <a class="brand-link" routerLink="/reclamos" aria-label="Ir a reclamos"><img src="assets/logo.png" alt="Coronel" /></a>
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
  `,
  styles: `
    :host{display:block}.reclamos-navbar{height:82px;display:flex;align-items:center;gap:68px;padding:0 3.7%;background:linear-gradient(105deg,#ffdf20,#ffd400)}.brand-link{display:flex;width:101px;height:auto;cursor:default;user-select:none}.brand-link img{width:100%;height:auto;-webkit-user-drag:none;user-select:none}.reclamos-navbar nav{display:flex;align-items:center;gap:5px;flex:1}.reclamos-navbar nav a{height:47px;display:flex;align-items:center;gap:10px;padding:0 18px;border-radius:11px;color:#111b36;font-size:14px;font-weight:800;text-decoration:none}.reclamos-navbar nav a.active{background:#fff5c2;box-shadow:0 2px 5px rgb(181 144 22 / 15%)}.notification-link{position:relative;display:flex;align-items:center;gap:10px}.notification-link b{min-width:17px;height:17px;display:grid;place-items:center;margin-left:-4px;padding:0 4px;border-radius:99px;background:#e5484d;color:#fff;font-size:10px}.user-actions{display:flex;align-items:center;gap:12px;white-space:nowrap}.logout-button{width:40px;height:40px;display:grid;place-items:center;border:0;border-radius:10px;background:transparent;color:#0b1837}.logout-button:hover{background:rgb(255 255 255 / 30%)}.avatar{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:#122555;color:#fff;font-size:13px;font-weight:800}.user-actions strong{font-size:14px}@media(max-width:767px){:host{display:none}}@media(max-width:1000px) and (min-width:768px){.reclamos-navbar{gap:26px}.brand-link{width:90px}.user-actions strong{display:none}}
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamosNavbarComponent {
  readonly avisos = inject(AvisosService);
  readonly usuarioNombre = input<string | null>(null);
  readonly logoutRequested = output<void>();
  readonly bellIcon = Bell;
  readonly fileIcon = FileText;
  readonly logoutIcon = LogOut;
  readonly initials = computed(() => {
    const name = this.usuarioNombre()?.trim();
    return name ? name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() : 'US';
  });
}
