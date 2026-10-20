import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavigationComponent } from './ui';
@Component({ selector: 'app-mobile-layout', imports: [RouterOutlet, BottomNavigationComponent], template: '<main class="mobile-layout"><router-outlet/></main><app-bottom-navigation/>', styles: '.mobile-layout{min-height:100dvh;padding-bottom:calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));box-sizing:border-box}', changeDetection: ChangeDetectionStrategy.OnPush })
export class MobileLayoutComponent {}
