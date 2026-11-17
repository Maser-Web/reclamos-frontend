import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppButtonComponent, AppHeaderComponent } from '../../core/components/ui';

@Component({
  standalone: true,
  imports: [AppHeaderComponent, AppButtonComponent],
  template: `<app-header title="Derivar reclamo" [showBack]="true" (back)="back()"/><section class="page notice"><h2>Datos de derivación pendientes</h2><p>El endpoint de derivación está disponible, pero el frontend necesita conocer el body que espera para enviar la asignación al servidor.</p><app-button label="Volver al reclamo" (click)="back()"/></section>`,
  styleUrl: './reclamo-derivar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamoDerivarComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  back(): void { void this.router.navigate(['/reclamos', this.route.snapshot.paramMap.get('id') ?? '']); }
}
