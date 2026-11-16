import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../Services/auth.service';
import { AppIconComponent, BottomNavigationComponent } from './ui';

@Component({
  selector: 'app-mobile-layout',
  imports: [RouterOutlet, BottomNavigationComponent, AppIconComponent],
  template: `
    <main class="mobile-layout" [class.mobile-layout--detail]="isClaimDetail()"><router-outlet/></main>
    @if (!isClaimDetail()) {<app-bottom-navigation/>}
    <button type="button" class="session-fab" aria-label="Cerrar sesión" aria-haspopup="dialog" [attr.aria-expanded]="confirmOpen()" (click)="confirmOpen.set(!confirmOpen())"><app-icon name="log-out" [size]="20"/></button>
    @if (confirmOpen()) {
      <div class="session-backdrop" (click)="confirmOpen.set(false)"></div>
      <section class="session-card" role="dialog" aria-labelledby="session-title">
        <strong id="session-title">¿Cerrar sesión?</strong>
        <span>Vas a volver a la pantalla de ingreso.</span>
        <div><button type="button" class="cancel" (click)="confirmOpen.set(false)">Cancelar</button><button type="button" class="confirm" (click)="logout()"><app-icon name="log-out" [size]="16"/>Salir</button></div>
      </section>
    }
  `,
  styleUrl: './mobile-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileLayoutComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly confirmOpen = signal(false);
  private readonly url = toSignal(this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => event.urlAfterRedirects),
    startWith(this.router.url),
  ), { initialValue: this.router.url });
  readonly isClaimDetail = computed(() => /^\/reclamos\/[^/?#]+$/.test(this.url()));

  logout(): void {
    this.confirmOpen.set(false);
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
