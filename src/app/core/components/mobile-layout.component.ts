import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavigationComponent } from './ui';
@Component({ selector: 'app-mobile-layout', imports: [RouterOutlet, BottomNavigationComponent], template: '<main class="mobile-layout"><router-outlet/></main><app-bottom-navigation/>', styleUrl: './mobile-layout.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class MobileLayoutComponent {
}
