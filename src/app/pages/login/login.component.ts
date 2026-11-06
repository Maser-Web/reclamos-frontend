import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/Services/auth.service';
import { NotificationService } from '../../core/Services/notification.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="login-page">
      <header class="login-header">
        <div class="header-brand">
          <span class="maser-wordmark" aria-label="Maser LINK"><b>Maser</b><strong>LINK</strong></span>
        </div>
      </header>

      <section class="mobile-hero" aria-label="Bienvenida">
        <div class="mobile-copy">
          <div class="maser-lockup maser-lockup--hero" aria-label="Maser LINK, Gestión y resolución de reclamos">
            <h1><span>Maser</span> LINK</h1>
            <p>Gestión y resolución<br />de reclamos</p>
          </div>
        </div>
        <div class="claim-illustration mobile-illustration" aria-hidden="true">
          <i class="orb orb-one"></i><i class="orb orb-two"></i><i class="spark spark-one"></i><i class="spark spark-two"></i>
          <div class="paper"><b></b><span></span><span></span><span></span><span></span></div>
          <div class="shield"><svg viewBox="0 0 48 48"><path d="m14 24 7 7 14-16"/></svg></div>
        </div>
      </section>

      <section class="login-shell">
        <section class="form-panel" aria-labelledby="login-title">
          <div class="desktop-welcome">
            <h1 id="login-title">Bienvenido</h1>
            <p class="intro">Ingresá tus datos para gestionar los reclamos.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <label for="usuario">Usuario</label>
            <div class="input-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg>
              <input id="usuario" formControlName="usuario" autocomplete="username" placeholder="Ingresá tu usuario" />
            </div>

            <label for="password">Contraseña</label>
            <div class="input-wrap password-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>
              <input id="password" [type]="showPassword ? 'text' : 'password'" formControlName="password" autocomplete="current-password" placeholder="Ingresá tu contraseña" />
              <button type="button" class="password-toggle" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" [attr.aria-pressed]="showPassword">
                @if (showPassword) {
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.9 10.9 0 0 1 12 4c5.2 0 8.8 4.3 9.8 6-.5.9-1.4 2.2-2.7 3.4M6.2 6.2C4.5 7.5 3.3 9.3 2.2 10c1 1.7 4.6 6 9.8 6 1.5 0 2.8-.3 3.9-.9"/><path d="M14.1 14.1A3 3 0 0 1 9.9 9.9"/></svg>
                } @else {
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 12S5.8 6 12 6s9.8 6 9.8 6-3.6 6-9.8 6S2.2 12 2.2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            <a class="forgot-password" href="#" (click)="$event.preventDefault()">¿Olvidaste tu contraseña?</a>
            <button class="login-button" type="submit" [disabled]="form.invalid || loading()">
              <span>{{ loading() ? 'Ingresando...' : 'Iniciar sesión' }}</span>
              @if (!loading()) { <svg viewBox="0 0 32 24" aria-hidden="true"><path d="M2 12h25M18 2l10 10-10 10"/></svg> }
            </button>
            <!-- Registro deshabilitado para producción.
            <a class="register-button" routerLink="/registro">Crear cuenta</a>
            -->
          </form>
        </section>

        <aside class="login-showcase" aria-label="Beneficios de Maser LINK">
          <div class="claim-illustration" aria-hidden="true">
            <i class="orb orb-one"></i><i class="orb orb-two"></i><i class="dot-grid"></i><i class="spark spark-one"></i><i class="spark spark-two"></i>
            <div class="paper"><b></b><span></span><span></span><span></span><span></span></div>
            <div class="shield"><svg viewBox="0 0 48 48"><path d="m14 24 7 7 14-16"/></svg></div>
          </div>
          <div class="showcase-content">
            <h2>Gestión de reclamos<br />más simple y eficiente</h2>
            <p>Centralizá, hacé seguimiento y resolvé<br />los reclamos de forma ágil y segura.</p>
            <ul>
              <li><span><svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="1"/><path d="M9 7h6M9 11h6M9 15h4"/></svg></span>Seguimiento en tiempo real</li>
              <li><span><svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.2"/><path d="M3 20a6 6 0 0 1 12 0M15 16a5 5 0 0 1 6 4"/></svg></span>Trabajo colaborativo</li>
              <li><span><svg viewBox="0 0 24 24"><path d="M12 3 19 6v5c0 4.6-2.8 8-7 10-4.2-2-7-5.4-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg></span>Información segura</li>
            </ul>
          </div>
        </aside>
      </section>

      <section class="mobile-security" aria-label="Acceso seguro">
        <span><svg viewBox="0 0 24 24"><path d="M12 3 19 6v5c0 4.6-2.8 8-7 10-4.2-2-7-5.4-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg></span>
        <p>Acceso seguro. Tu información está protegida<br />y se mantiene confidencial.</p>
      </section>

      <footer class="login-footer">
        <p>© 2026 Maser LINK. Todos los derechos reservados.</p>
        <nav aria-label="Enlaces legales"><a href="#">Términos de uso</a><a href="#">Privacidad</a><a href="#">Soporte</a></nav>
      </footer>
    </main>
  `,
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  showPassword = false;
  readonly loading = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    usuario: ['', [Validators.required, Validators.maxLength(10)]],
    password: ['', [Validators.required, Validators.maxLength(20)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.notifications.warning('Completá los datos', 'Ingresá un usuario y contraseña válidos para continuar.');
      return;
    }
    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.notifications.success('¡Bienvenido!', 'El acceso fue validado correctamente.').then(() => {
        void this.router.navigateByUrl('/reclamos');
      }),
      error: error => {
        this.loading.set(false);
        void this.notifications.error('Acceso denegado', this.errorMessage(error));
      },
      complete: () => this.loading.set(false),
    });
  }

  private errorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const body = error.error;
      if (typeof body === 'object' && body !== null && 'mensaje' in body && typeof body.mensaje === 'string') return body.mensaje;
    }
    return error instanceof Error ? error.message : 'No se pudo iniciar sesión. Intentá nuevamente.';
  }
}
