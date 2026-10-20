import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/Services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `<main class="login-page"><section class="login-card" aria-labelledby="login-title"><div class="brand-mark" aria-hidden="true">C</div><p class="eyebrow">CORONEL</p><h1 id="login-title">Bienvenido</h1><p class="intro">Ingresá tus datos para gestionar los reclamos.</p><form [formGroup]="form" (ngSubmit)="submit()" novalidate><label for="usuario">Usuario<input id="usuario" formControlName="usuario" autocomplete="username" placeholder="Ingresá tu usuario"/></label><label for="contrasena">Contraseña<div class="password-field"><input id="contrasena" [type]="showPassword ? 'text' : 'password'" formControlName="contrasena" autocomplete="current-password" placeholder="Ingresá tu contraseña"/><button type="button" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">{{ showPassword ? 'Ocultar' : 'Ver' }}</button></div></label><button class="login-button" type="submit" [disabled]="form.invalid">Iniciar sesión</button></form><p class="hint">Acceso demo: <b>admin</b> / <b>coronel2026</b></p></section></main>`,
  styles: `.login-page{min-height:100dvh;display:grid;place-items:center;padding:24px;background:linear-gradient(155deg,var(--color-primary) 0 29%,var(--color-background) 29%)}.login-card{width:min(100%,420px);background:var(--color-surface);border:1px solid #ffffff99;border-radius:var(--radius-lg);padding:32px 24px;box-shadow:0 18px 50px #07153b24}.brand-mark{width:54px;height:54px;display:grid;place-items:center;border-radius:16px;background:var(--color-primary);font-size:28px;font-weight:900;margin-bottom:20px}.eyebrow{letter-spacing:2px;font-size:12px;font-weight:800;margin:0;color:var(--color-text-secondary)}h1{font-size:var(--font-xl);margin:4px 0 8px}.intro,.hint{color:var(--color-text-secondary);line-height:1.5}.intro{margin:0 0 26px}.hint{text-align:center;font-size:13px;margin:20px 0 0}form{display:grid;gap:18px}label{display:grid;gap:7px;font-size:14px;font-weight:800}input{width:100%;padding:14px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font:inherit;color:var(--color-text);outline-color:#d3aa00}.password-field{position:relative}.password-field input{padding-right:62px}.password-field button{position:absolute;right:4px;top:4px;bottom:4px;border:0;border-radius:7px;background:transparent;color:var(--color-text-secondary);font-weight:700}.login-button{min-height:54px;border:0;border-radius:var(--radius-md);background:var(--color-primary);color:var(--color-text);font:inherit;font-size:var(--font-md);font-weight:800}.login-button:disabled{opacity:.55;cursor:not-allowed}`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  showPassword = false;
  readonly form = this.formBuilder.nonNullable.group({
    usuario: ['', [Validators.required]],
    contrasena: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void Swal.fire({ icon: 'error', title: 'Completá los datos', text: 'Ingresá tu usuario y contraseña para continuar.', confirmButtonColor: '#ffe000', color: '#07153b' });
      return;
    }
    if (!this.auth.login(this.form.getRawValue())) {
      void Swal.fire({ icon: 'error', title: 'Acceso denegado', text: 'El usuario o la contraseña son incorrectos.', confirmButtonColor: '#ffe000', color: '#07153b' });
      return;
    }
    void Swal.fire({ icon: 'success', title: '¡Bienvenido!', text: 'El acceso fue validado correctamente.', timer: 1300, showConfirmButton: false, color: '#07153b' }).then(() => {
      this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || '/reclamos');
    });
  }
}
