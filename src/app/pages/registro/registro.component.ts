import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../core/Services/notification.service';
import { UsuarioService } from '../../core/Services/usuario.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="register-page">
      <header class="register-header">
        <div class="header-brand"><span class="maser-wordmark" aria-label="Maser LINK"><b>Maser</b><strong>LINK</strong></span></div>
      </header>

      <section class="register-layout">
        <aside class="benefits" aria-label="Beneficios de Maser LINK">
          <div class="maser-lockup" aria-label="Maser LINK, Gestión y resolución de reclamos"><p><span>Maser</span> LINK</p><small>Gestión y resolución<br />de reclamos</small></div>
          <h1>Creá tu cuenta<br />en Maser LINK</h1>
          <p class="benefit-intro">Gestioná, realizá y hacé seguimiento<br />de reclamos de forma simple y rápida.</p>
          <ul>
            <li><span class="round-icon"><svg viewBox="0 0 24 24"><path d="M7 3h8l3 3v15H7z"/><path d="M15 3v4h3M10 11h5M10 15h5"/></svg></span><p><b>Registrá tus reclamos</b><small>Ingresá nuevos reclamos de manera simple.</small></p></li>
            <li><span class="round-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg></span><p><b>Hacé seguimiento</b><small>Conocé el estado en tiempo real.</small></p></li>
            <li><span class="round-icon"><svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M14 17.2a4.7 4.7 0 0 1 6.5 2.8"/></svg></span><p><b>Trabajamos juntos</b><small>Un mejor servicio para todos.</small></p></li>
          </ul>
          <div class="worker-art" aria-hidden="true">
            <i class="sun"></i><i class="plant one"></i><i class="plant two"></i>
            <div class="message"><b>▤</b><span></span><span></span><span></span></div>
            <div class="worker"><i class="hair"></i><i class="head"></i><i class="body"></i><i class="arm"></i></div>
            <div class="laptop"><i></i></div><div class="desk"></div>
          </div>
        </aside>

        <section class="form-card" aria-labelledby="register-title">
          <div class="maser-lockup mobile-brand" aria-label="Maser LINK, Gestión y resolución de reclamos"><p><span>Maser</span> LINK</p><small>Gestión y resolución de reclamos</small></div>
          <h2 id="register-title">Crear cuenta</h2>
          <p class="form-intro">Completá tus datos para comenzar a usar<br class="desktop-break" /> Maser LINK.</p>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <label for="nombre">Nombre y apellido</label>
            <div class="field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>
              <input id="nombre" formControlName="nombre" autocomplete="name" placeholder="Ej: Juan Pérez" />
            </div>

            <label for="fechaNacimiento">Fecha de nacimiento</label>
            <div class="field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h3"/></svg>
              <input id="fechaNacimiento" formControlName="fechaNacimiento" type="date" autocomplete="bday" [max]="today" />
            </div>

            <label for="password">Contraseña</label>
            <div class="field password-field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="1.5"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M12 14v2"/></svg>
              <input id="password" formControlName="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="new-password" placeholder="Ingresá tu contraseña" />
              <button type="button" (click)="showPassword.set(!showPassword())" [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">{{ showPassword() ? 'Ocultar' : 'Ver' }}</button>
            </div>

            <label for="confirmar">Confirmar contraseña</label>
            <div class="field password-field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="1.5"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M12 14v2"/></svg>
              <input id="confirmar" formControlName="confirmar" [type]="showConfirmation() ? 'text' : 'password'" autocomplete="new-password" placeholder="Confirmá tu contraseña" />
              <button type="button" (click)="showConfirmation.set(!showConfirmation())" [attr.aria-label]="showConfirmation() ? 'Ocultar contraseña' : 'Mostrar contraseña'">{{ showConfirmation() ? 'Ocultar' : 'Ver' }}</button>
            </div>

            <label class="terms"><input type="checkbox" formControlName="terminos" /><span>Acepto los <a href="#terminos" (click)="$event.preventDefault()">Términos y Condiciones</a> y la <a href="#privacidad" (click)="$event.preventDefault()">Política de Privacidad.</a></span></label>
            <button class="submit" type="submit" [disabled]="loading()">{{ loading() ? 'Creando cuenta...' : 'Crear cuenta' }}</button>
          </form>
          <div class="or"><span></span><i>o</i><span></span></div>
          <p class="login-link">¿Ya tenés cuenta? <a routerLink="/login">Iniciá sesión</a></p>
        </section>
      </section>
    </main>
  `,
  styleUrl: './registro.component.scss',
})
export class RegistroComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usuarios = inject(UsuarioService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmation = signal(false);
  readonly today = new Date().toISOString().slice(0, 10);
  readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(30)]],
    fechaNacimiento: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmar: ['', Validators.required],
    terminos: [false, Validators.requiredTrue],
  });

  submit(): void {
    if (this.form.invalid || this.form.controls.password.value !== this.form.controls.confirmar.value) {
      this.form.markAllAsTouched();
      const message = this.form.controls.password.value !== this.form.controls.confirmar.value
        ? 'Las contraseñas deben coincidir.'
        : 'Completá todos los campos y aceptá los términos para continuar.';
      void this.notifications.warning('Revisá los datos', message);
      return;
    }

    const { nombre, fechaNacimiento, password } = this.form.getRawValue();
    this.loading.set(true);
    this.usuarios.crear({
      usuNombre: nombre.toUpperCase(),
      usuContrasena: password,
      usuFecnac: fechaNacimiento,
    }).subscribe({
      next: () => void this.notifications.success('¡Cuenta creada!', 'Ya podés iniciar sesión.').then(() => {
        void this.router.navigateByUrl('/login');
      }),
      error: error => {
        this.loading.set(false);
        void this.notifications.error('No pudimos crear tu cuenta', this.errorMessage(error));
      },
      complete: () => this.loading.set(false),
    });
  }

  private errorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const body = error.error;
      if (typeof body === 'string') return body;
      if (typeof body === 'object' && body !== null && 'mensaje' in body && typeof body.mensaje === 'string') return body.mensaje;
      if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') return body.message;
    }
    return 'Intentá nuevamente en unos minutos.';
  }
}
