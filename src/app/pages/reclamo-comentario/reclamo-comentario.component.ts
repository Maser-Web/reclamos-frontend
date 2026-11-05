import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppButtonComponent, AppHeaderComponent } from '../../core/components/ui';

@Component({
  standalone: true,
  imports: [AppHeaderComponent, AppButtonComponent],
  template: `<app-header title="Agregar comentario" [showBack]="true" (back)="back()"/><section class="page notice"><h2>Acción no disponible</h2><p>El backend actual no expone un endpoint para comentarios. El comentario enviado al finalizar tampoco es persistido por el servidor.</p><app-button label="Volver al reclamo" (click)="back()"/></section>`,
  styleUrl: './reclamo-comentario.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamoComentarioComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  back(): void { void this.router.navigate(['/reclamos', this.route.snapshot.paramMap.get('id') ?? '']); }
}
