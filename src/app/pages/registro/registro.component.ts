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
        <div class="header-brand"><img src="assets/logo.png" alt="Coronel" /><span></span><strong>Coronel Reclamos</strong></div>
      </header>

      <section class="register-layout">
        <aside class="benefits" aria-label="Beneficios de Coronel Reclamos">
          <p class="eyebrow">CORONEL</p>
          <h1>Creá tu cuenta<br />en Coronel Reclamos</h1>
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
          <img class="mobile-brand" src="assets/logo.png" alt="Coronel" />
          <p class="mobile-eyebrow">CORONEL</p>
          <h2 id="register-title">Crear cuenta</h2>
          <p class="form-intro">Completá tus datos para comenzar a usar<br class="desktop-break" /> Coronel Reclamos.</p>

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
  styles: `
    :host{display:block}.register-page{--navy:#071332;--text-muted:#69768e;min-height:100dvh;color:var(--navy);background:#f8fafc;font-family:var(--font-family)}.register-header{height:80px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 36px;background:linear-gradient(100deg,#ffdd00,#ffd000);box-shadow:0 1px 3px rgb(0 0 0 / 8%)}.register-header img{width:67px}.register-header strong{font-size:20px;font-weight:800;letter-spacing:-.055em}.register-header a{justify-self:end;display:flex;align-items:center;gap:7px;color:#06132e;font-size:13px;font-weight:800;text-decoration:none}.register-header svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:2.3}.register-layout{display:grid;grid-template-columns:minmax(420px,1fr) minmax(440px,1fr);min-height:calc(100dvh - 80px)}.benefits{position:relative;overflow:hidden;padding:76px clamp(34px,4.1vw,68px);background:radial-gradient(circle at 90% 92%,#fff4ca 0,transparent 30%),linear-gradient(125deg,#fffefa,#fffdf5)}.benefits:after{position:absolute;right:-110px;bottom:-80px;width:390px;height:390px;border-radius:50%;content:'';background:#fff6d8}.eyebrow,.mobile-eyebrow{margin:0 0 7px;color:#61708c;font-size:12px;font-weight:800;letter-spacing:.17em}.benefits h1{margin:0;color:var(--navy);font-size:clamp(32px,3.2vw,42px);line-height:1.16;letter-spacing:-.065em}.benefit-intro{margin:10px 0 37px;color:#68758d;font-size:17px;line-height:1.42;letter-spacing:-.04em}.benefits ul{position:relative;z-index:1;display:grid;gap:20px;margin:0;padding:0;list-style:none}.benefits li{display:flex;align-items:center;gap:17px}.round-icon{width:49px;height:49px;display:grid;flex:0 0 auto;place-items:center;border-radius:50%;background:linear-gradient(135deg,#fff2b5,#ffdc31)}.round-icon svg{width:27px;height:27px;fill:none;stroke:#061335;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.8}.benefits li p{margin:0;line-height:1.25}.benefits li b,.benefits li small{display:block}.benefits li b{font-size:15px;letter-spacing:-.04em}.benefits li small{color:#69778e;font-size:13px;letter-spacing:-.03em}.worker-art{position:absolute;z-index:1;bottom:28px;left:16px;width:390px;height:263px}.sun{position:absolute;bottom:-34px;left:16px;width:287px;height:235px;border-radius:48% 52% 0 0;background:linear-gradient(135deg,#fff8de,#fff0ba)}.plant{position:absolute;z-index:2;bottom:20px;width:10px;height:80px;border-radius:100%;background:#d6dce1;transform-origin:bottom}.plant.one{left:40px;transform:rotate(-28deg)}.plant.two{left:65px;height:64px;transform:rotate(25deg)}.message{position:absolute;z-index:4;right:27px;top:50px;width:135px;height:82px;padding:16px 13px 0 53px;border-radius:17px;background:#fff;box-shadow:0 12px 23px rgb(66 75 97 / 14%)}.message:after{position:absolute;bottom:-11px;left:24px;border:14px solid transparent;border-top-color:#fff;content:''}.message b{position:absolute;left:15px;top:17px;display:grid;width:29px;height:36px;place-items:center;border-radius:4px;background:#ffd419;color:#182143;font-size:23px}.message span{display:block;width:100%;height:5px;margin:5px 0;border-radius:9px;background:#d0d5dc}.message span:nth-child(3){width:68%}.message span:nth-child(4){width:82%}.worker{position:absolute;z-index:3;bottom:23px;left:76px;width:137px;height:199px}.head{position:absolute;z-index:2;top:37px;left:35px;width:54px;height:64px;border-radius:45% 48% 46% 45%;background:#ffb385}.hair{position:absolute;z-index:3;top:22px;left:29px;width:81px;height:47px;border-radius:48% 42% 35% 35%;background:#0b2447;transform:rotate(6deg)}.hair:after{position:absolute;right:-11px;top:4px;width:28px;height:12px;border-radius:99px;background:#0b2447;content:''}.body{position:absolute;bottom:0;left:0;width:127px;height:121px;border-radius:45px 46px 0 0;background:linear-gradient(110deg,#ffeb00,#f9cf00);transform:skewY(-4deg)}.arm{position:absolute;z-index:2;right:-9px;bottom:19px;width:72px;height:25px;border-radius:99px;background:#ffb385;transform:rotate(14deg)}.laptop{position:absolute;z-index:5;right:7px;bottom:22px;width:151px;height:91px;border-radius:7px 7px 3px 3px;background:linear-gradient(135deg,#243653,#4d5b75);transform:skewX(-8deg)}.laptop i{position:absolute;left:65px;top:43px;width:15px;height:15px;border-radius:50%;background:#aab5c5}.desk{position:absolute;z-index:6;right:0;bottom:0;left:0;height:19px;border-radius:99px;background:#cdd4da}.form-card{align-self:center;width:min(100% - 64px,450px);margin:45px auto;padding:25px 22px 24px;border:1px solid #e7ebf1;border-radius:15px;background:linear-gradient(135deg,#fff,#fffefd);box-shadow:0 3px 14px rgb(40 55 84 / 5%)}.mobile-brand,.mobile-eyebrow{display:none}.form-card h2{margin:0 0 4px;font-size:30px;line-height:1.22;letter-spacing:-.065em}.form-intro{margin:0 0 18px;color:#71809a;font-size:14px;line-height:1.42;letter-spacing:-.035em}.form-card form{display:grid;gap:0}.form-card label:not(.terms){margin:0 0 5px;color:#101a32;font-size:13px;font-weight:800;letter-spacing:-.03em}.field{position:relative;display:flex;align-items:center;height:43px;margin:0 0 14px;border:1px solid #d6ddea;border-radius:11px;background:#fff;transition:.16s ease}.field:focus-within{border-color:#c7a300;box-shadow:0 0 0 3px rgb(255 214 0 / 17%)}.field>svg{width:20px;height:20px;flex:0 0 auto;margin:0 13px;color:#50617e;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.85}.field input{width:100%;min-width:0;min-height:0;height:100%;padding:0 10px 0 0;border:0!important;border-radius:0;background:transparent!important;box-shadow:none!important;color:var(--navy);font:500 13px var(--font-family);outline:0}.field input::placeholder{color:#8b97ad}.password-field input{padding-right:45px}.password-field button{position:absolute;right:10px;padding:4px;border:0;background:transparent;color:#53627f;font:800 12px var(--font-family)}.terms{display:flex;align-items:flex-start;gap:8px;margin:1px 0 14px;color:#66748d;font-size:10px;line-height:1.35;letter-spacing:-.035em}.terms input{width:16px;height:16px;flex:0 0 auto;margin:0;accent-color:#f5ce00}.terms a,.login-link a{color:#e6a900;font-weight:800}.submit{height:43px;border:0;border-radius:11px;background:linear-gradient(100deg,#ffd800,#ffcf00);color:#071332;font:800 13px var(--font-family);box-shadow:0 2px 0 rgb(202 162 0 / 25%);transition:filter .15s ease,transform .15s ease}.submit:not(:disabled):hover{filter:brightness(.98)}.submit:not(:disabled):active{transform:translateY(1px)}.submit:disabled{cursor:wait;opacity:.66}.or{display:flex;align-items:center;gap:11px;margin:19px 0 11px;color:#7c889e}.or span{height:1px;flex:1;background:#dde2ea}.or i{font-size:12px;font-style:normal}.login-link{margin:0;text-align:center;color:#65738b;font-size:12px;letter-spacing:-.035em}.login-link a{margin-left:3px}.desktop-break{display:block}
    @media (min-width:768px) and (max-height:920px){.benefits{padding-top:55px}.benefit-intro{margin-bottom:25px}.benefits ul{gap:15px}.worker-art{transform:scale(.83);transform-origin:bottom left}.form-card{margin:22px auto;padding-block:21px}.form-intro{margin-bottom:14px}.field{height:40px;margin-bottom:10px}.terms{margin-bottom:10px}.or{margin:14px 0 8px}}
    @media (max-width:767px){.register-page{min-height:100dvh;background:#f4f7fb}.register-header{height:54px;padding:0 27px}.register-header img{width:67px}.register-header strong{font-size:20px}.register-header a{gap:6px;font-size:13px}.register-header svg{width:21px;height:21px}.register-layout{display:block;min-height:calc(100dvh - 54px);padding:32px 0 21px;background:linear-gradient(151deg,#ffe100 0 0,#ffe100 29%,#edf2f8 29.2%,#f7f9fb 100%)}.benefits{display:none}.form-card{width:min(calc(100% - 42px),414px);margin:0 auto;padding:31px 45px 15px;border:0;border-radius:15px;box-shadow:0 13px 30px rgb(50 68 98 / 11%)}.mobile-brand{display:block;width:72px;margin:0 0 21px}.mobile-eyebrow{display:block;margin-bottom:6px;font-size:11px}.form-card h2{margin-bottom:4px;font-size:29px}.form-intro{margin-bottom:15px;font-size:14px}.desktop-break{display:none}.form-card label:not(.terms){margin-bottom:5px;font-size:13px}.field{height:42px;margin-bottom:14px}.field>svg{width:20px;height:20px;margin-inline:12px}.field input{font-size:13px}.terms{margin:1px 0 14px;font-size:10px}.submit{height:42px;font-size:13px}.or{margin:16px 0 9px}.login-link{font-size:12px}}
    @media (max-width:390px){.register-layout{padding-top:24px}.form-card{width:calc(100% - 30px);padding:27px 30px 14px}.mobile-brand{margin-bottom:17px}.field{margin-bottom:11px}.form-intro{margin-bottom:12px}.terms{font-size:9px}.or{margin-top:13px}}
    @media (max-width:767px){.register-header{display:flex;justify-content:space-between}.register-header .header-brand{display:flex;align-items:center}.register-header .header-brand>span{display:none}.register-header .header-brand strong{font-size:0}.register-header .header-brand strong:after{content:'Reclamos';font-size:20px;letter-spacing:-.055em}.register-header>a span{font-size:0}.register-header>a span:after{content:'Ayuda';font-size:13px}}
    /* El registro comparte el marco visual del inicio de sesión. */
    @media (min-width:768px){.register-page{position:relative;overflow:hidden;background:#f8f9fb}.register-page:before{position:absolute;z-index:0;top:0;left:0;width:66%;height:472px;content:'';background:radial-gradient(circle at 20% 7%,#ffec76 0,transparent 27%),linear-gradient(120deg,#ffd91b 0%,#ffdc23 100%);clip-path:polygon(0 0,100% 0,68% 100%,0 100%)}.register-header,.register-layout{position:relative;z-index:1}.register-header{height:112px;display:flex;padding:0 clamp(40px,4.4vw,64px);background:transparent;box-shadow:none}.register-header .header-brand{display:flex;align-items:center;gap:22px;font-size:18px}.register-header .header-brand img{width:105px;height:auto}.register-header .header-brand>span{width:1px;height:29px;background:#1a2740}.register-header .header-brand strong{font-weight:800;letter-spacing:-.04em}.register-header>a{gap:9px;color:#677189;font-size:15px;font-weight:600}.register-header>a svg{width:23px;height:23px;stroke-width:1.8}.register-layout{width:min(1092px,calc(100% - 48px));min-height:730px;margin:41px auto 68px;grid-template-columns:54.8% 45.2%;overflow:hidden;border:1px solid rgb(255 255 255 / 75%);border-radius:20px;background:#fff;box-shadow:0 32px 55px rgb(30 48 80 / 13%)}.benefits{padding:70px 60px;background:radial-gradient(circle at 80% 15%,#fff 0,transparent 40%),linear-gradient(135deg,#fffdf7,#fff9e6)}.form-card{align-self:stretch;width:auto;margin:0;padding:72px 58px 42px;border:0;border-radius:0;box-shadow:none;background:#fff}.form-card h2{font-size:40px}.form-intro{margin-bottom:26px;font-size:17px}.form-card label:not(.terms){font-size:15px}.field{height:54px;margin-bottom:12px;border-radius:12px}.field>svg{width:22px;height:22px;margin:0 16px}.field input{font-size:15px}.password-field button{right:12px;font-size:14px}.terms{margin:4px 0 17px;font-size:11px}.submit{height:58px;border-radius:12px;font-size:17px}.or{margin:18px 0 10px}.login-link{font-size:14px}.worker-art{bottom:20px}.benefits h1{font-size:36px}.benefit-intro{font-size:17px}}
    @media (min-width:768px) and (max-height:960px){.register-header{height:76px}.register-layout{min-height:620px;height:calc(100dvh - 112px);margin:16px auto 20px}.benefits{padding:43px 46px}.benefits h1{font-size:31px}.benefit-intro{margin:8px 0 22px;font-size:15px}.benefits ul{gap:13px}.worker-art{transform:scale(.75);transform-origin:bottom left}.form-card{padding:32px 52px 20px}.form-card h2{font-size:32px}.form-intro{margin-bottom:14px;font-size:14px}.field{height:41px;margin-bottom:8px}.form-card label:not(.terms){font-size:13px}.terms{margin:2px 0 9px}.submit{height:44px}.or{margin:12px 0 7px}}
  `,
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
