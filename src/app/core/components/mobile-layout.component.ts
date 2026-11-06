import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { BottomNavigationComponent } from './ui';
@Component({ selector: 'app-mobile-layout', imports: [RouterOutlet, BottomNavigationComponent], template: '<main class="mobile-layout" [class.mobile-layout--detail]="isClaimDetail()"><router-outlet/></main>@if (!isClaimDetail()) {<app-bottom-navigation/>}', styleUrl: './mobile-layout.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class MobileLayoutComponent {
  private readonly router = inject(Router);
  private readonly url = toSignal(this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => event.urlAfterRedirects),
    startWith(this.router.url),
  ), { initialValue: this.router.url });
  readonly isClaimDetail = computed(() => /^\/reclamos\/[^/?#]+$/.test(this.url()));
}
