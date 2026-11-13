import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/Services/auth.service';
import { RECLAMO_ESTADOS } from '../../core/constants/reclamo-estados';
import { ReclamosService } from '../../core/Services/reclamos.service';
import { MotivosReclamosService } from '../../core/Services/motivos-reclamos.service';
import { AppButtonComponent, AppHeaderComponent, AppIconComponent } from '../../core/components/ui';
import { NotificationService } from '../../core/Services/notification.service';
import { MotivoReclamo } from '../../core/interfaces/motivo-reclamo.interface';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, AppHeaderComponent, AppButtonComponent, AppIconComponent],
  template: `<app-header title="Finalizar reclamo" [showBack]="true" (back)="back()"/><form class="page close-form" [formGroup]="form" (ngSubmit)="submit()"><div class="field"><span class="field-label">Motivo de cierre *</span>@if (loadingMotivos()) {<p class="notice" role="status">Cargando motivos de clausura…</p>} @else if (motivosError(); as error) {<span class="notice" role="alert">{{ error }}</span><button type="button" class="retry" (click)="loadMotivos(true)">Reintentar</button>} @else {<div class="motivo-picker"><button id="motivo" type="button" class="motivo-trigger" [attr.aria-expanded]="menuOpen()" aria-haspopup="listbox" aria-label="Seleccionar motivo de cierre" (click)="menuOpen.set(!menuOpen())"><span [class.placeholder]="!form.controls.motivo.value">{{ form.controls.motivo.value || 'Seleccione un motivo' }}</span><app-icon name="chevron-down" [size]="18"/></button>@if (menuOpen()) {<ul class="motivo-options" role="listbox" aria-label="Motivos de cierre">@for (motivo of motivos(); track motivo.mtrCodigo) {<li><button type="button" role="option" [attr.aria-selected]="form.controls.motivo.value === motivo.mtrDescri" [class.selected]="form.controls.motivo.value === motivo.mtrDescri" (click)="selectMotivo(motivo)"><span>{{ motivo.mtrDescri }}</span><app-icon name="check" [size]="17"/></button></li>}</ul>}</div>@if (!motivos().length) {<span class="notice" role="alert">No hay motivos de clausura disponibles.</span>}}</div><label>Comentario de cierre<textarea formControlName="comentario" placeholder="Describa la solución realizada..."></textarea></label><app-button type="submit" label="Finalizar reclamo" icon="check" variant="success" [disabled]="form.invalid || saving() || loadingMotivos() || !!motivosError() || !motivos().length"/></form>`,
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
  readonly menuOpen = signal(false);
  readonly motivos = signal<MotivoReclamo[]>([]);
  readonly loadingMotivos = signal(false);
  readonly motivosError = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({ motivo: ['', Validators.required], comentario: [''] });

  constructor() { this.loadMotivos(); }

  loadMotivos(forceRefresh = false): void {
    this.loadingMotivos.set(true); this.motivosError.set(null);
    this.motivosService.clausura({ forceRefresh }).pipe(finalize(() => this.loadingMotivos.set(false))).subscribe({
      next: motivos => this.motivos.set(motivos),
      error: () => this.motivosError.set('No pudimos cargar los motivos de clausura. Intentá nuevamente.'),
    });
  }

  selectMotivo(motivo: MotivoReclamo): void {
    this.form.controls.motivo.setValue(motivo.mtrDescri);
    this.form.controls.motivo.markAsTouched();
    this.menuOpen.set(false);
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
