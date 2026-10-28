import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/Services/auth.service';
import { RECLAMO_ESTADOS } from '../../core/constants/reclamo-estados';
import { ReclamosService } from '../../core/Services/reclamos.service';
import { AppButtonComponent, AppHeaderComponent } from '../../core/components/ui';
import { NotificationService } from '../../core/Services/notification.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, AppHeaderComponent, AppButtonComponent],
  template: `<app-header title="Finalizar reclamo" [showBack]="true" (back)="back()"/><form class="page close-form" [formGroup]="form" (ngSubmit)="submit()"><label>Motivo de cierre *<select formControlName="motivo"><option value="">Seleccione un motivo</option><option>Resuelto</option><option>No corresponde</option><option>Sin respuesta del cliente</option></select></label><label>Comentario de cierre<textarea formControlName="comentario" placeholder="Describa la solución realizada..."></textarea></label><p class="notice">El backend registrará la finalización y el usuario. El comentario no es persistido actualmente por el backend.</p><app-button type="submit" label="Finalizar reclamo" icon="check" variant="success" [disabled]="form.invalid || saving()"/></form>`,
  styles: `.close-form{display:grid;gap:26px}.close-form label{font-weight:800;display:grid;gap:8px}.close-form select,.close-form textarea{font:inherit;padding:14px;border:1px solid var(--color-border);border-radius:var(--radius-md)}.close-form textarea{min-height:150px}.notice{margin:0;color:var(--color-text-secondary);font-size:var(--font-sm);line-height:1.4}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamoCerrarComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ReclamosService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({ motivo: ['', Validators.required], comentario: [''] });

  submit(): void {
    if (this.form.invalid) return;
    const usuCodigo = this.auth.usuarioCodigo();
    if (usuCodigo === null) {
      void this.notifications.error('Sesión no disponible', 'Volvé a iniciar sesión para finalizar el reclamo.');
      return;
    }
    this.saving.set(true);
    this.service.actualizarEstado(this.id(), RECLAMO_ESTADOS.FINALIZADO, {
      usuCodigo: String(usuCodigo),
      comentario: this.form.controls.comentario.value || undefined,
    }).subscribe({
      next: () => {
        void this.notifications.success('Reclamo finalizado', 'La actualización se registró correctamente.');
        void this.router.navigate(['/reclamos', this.id()]);
      },
      error: error => {
        this.saving.set(false);
        void this.notifications.error('No se pudo finalizar', this.errorMessage(error));
      },
      complete: () => this.saving.set(false),
    });
  }

  back(): void { void this.router.navigate(['/reclamos', this.id()]); }
  private id(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }
  private errorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const body = error.error;
      if (typeof body === 'object' && body !== null && 'mensaje' in body && typeof body.mensaje === 'string') return body.mensaje;
    }
    return error instanceof Error ? error.message : 'Intentá nuevamente.';
  }
}
