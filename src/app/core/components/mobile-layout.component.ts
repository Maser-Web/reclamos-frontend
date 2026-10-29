import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EMPTY, catchError, exhaustMap, timer } from 'rxjs';
import { AuthService } from '../Services/auth.service';
import { AvisosService } from '../Services/avisos.service';
import { BottomNavigationComponent } from './ui';
@Component({ selector: 'app-mobile-layout', imports: [RouterOutlet, BottomNavigationComponent], template: '<main class="mobile-layout"><router-outlet/></main><app-bottom-navigation/>', styles: '.mobile-layout{min-height:100dvh;padding-bottom:calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));box-sizing:border-box}@media(min-width:768px){.mobile-layout{padding-bottom:0}}', changeDetection: ChangeDetectionStrategy.OnPush })
export class MobileLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);

  private readonly polling = effect(onCleanup => {
    if (!this.auth.isAuthenticated()) {
      this.avisos.limpiar();
      return;
    }

    const subscription = timer(0, 15_000).pipe(
      exhaustMap(() => this.avisos.consultarAvisos().pipe(catchError(() => EMPTY))),
    ).subscribe();

    onCleanup(() => {
      subscription.unsubscribe();
      if (!this.auth.isAuthenticated()) this.avisos.limpiar();
    });
  });
}
