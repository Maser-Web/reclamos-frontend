import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/Services/auth.service';
import { RECLAMO_ESTADOS } from '../../core/constants/reclamo-estados';
import { ReclamosService } from '../../core/Services/reclamos.service';
import { MotivosReclamosService } from '../../core/Services/motivos-reclamos.service';
import { AppButtonComponent, AppHeaderComponent } from '../../core/components/ui';
import { NotificationService } from '../../core/Services/notification.service';
import { MotivoReclamo } from '../../core/interfaces/motivo-reclamo.interface';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, AppHeaderComponent, AppButtonComponent],
  template: `<app-header title="Finalizar reclamo" [showBack]="true" (back)="back()"/><form class="page close-form" [formGroup]="form" (ngSubmit)="submit()"><label>Motivo de cierre *@if (loadingMotivos()) {<p class="notice" role="status">Cargando motivos de clausura…</p>} @else if (motivosError(); as error) {<span class="notice" role="alert">{{ error }}</span><button type="button" class="retry" (click)="loadMotivos()">Reintentar</button>} @else {<select formControlName="motivo"><option value="">Seleccione un motivo</option>@for (motivo of motivos(); track motivo.mtrCodigo) {<option [value]="motivo.mtrDescri">{{ motivo.mtrDescri }}</option>}</select>@if (!motivos().length) {<span class="notice" role="alert">No hay motivos de clausura disponibles.</span>}}</label><label>Comentario de cierre<textarea formControlName="comentario" placeholder="Describa la solución realizada..."></textarea></label><app-button type="submit" label="Finalizar reclamo" icon="check" variant="success" [disabled]="form.invalid || saving() || loadingMotivos() || !!motivosError() || !motivos().length"/></form>`,
  styleUrl: './reclamo-cerrar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamoCerrarComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ReclamosService);
  private readonly motivosService = inject(MotivosReclamosService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  readonly saving = signal(false);
  readonly motivos = signal<MotivoReclamo[]>([]);
  readonly loadingMotivos = signal(false);
  readonly motivosError = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({ motivo: ['', Validators.required], comentario: [''] });

  constructor() { this.loadMotivos(); }

  loadMotivos(): void {
    this.loadingMotivos.set(true); this.motivosError.set(null);
    this.motivosService.clausura().pipe(finalize(() => this.loadingMotivos.set(false))).subscribe({
      next: motivos => this.motivos.set(motivos),
      error: () => this.motivosError.set('No pudimos cargar los motivos de clausura. Intentá nuevamente.'),
    });
  }

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
