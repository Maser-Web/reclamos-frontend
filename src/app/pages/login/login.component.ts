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
          <img src="assets/logo.png" alt="Coronel" />
          <span></span>
          <strong>Coronel Reclamos</strong>
        </div>
        <a class="help-link" href="#" (click)="$event.preventDefault()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2M18 19c0 1.1-.9 2-2 2h-1M4 14h2v5H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2Zm16 0h-2v5h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2Z"/></svg>
          ¿Necesitás ayuda?
        </a>
      </header>

      <section class="mobile-hero" aria-label="Bienvenida">
        <div class="mobile-copy">
          <img src="assets/logo.png" alt="Coronel" class="mobile-logo" />
          <h1>Bienvenido</h1>
          <p>Ingresá tus datos para gestionar<br />los reclamos.</p>
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
              <button type="button" class="password-toggle" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">{{ showPassword ? 'Ocultar' : 'Ver' }}</button>
            </div>

            <a class="forgot-password" href="#" (click)="$event.preventDefault()">¿Olvidaste tu contraseña?</a>
            <button class="login-button" type="submit" [disabled]="form.invalid || loading()">
              <span>{{ loading() ? 'Ingresando...' : 'Iniciar sesión' }}</span>
              @if (!loading()) { <svg viewBox="0 0 32 24" aria-hidden="true"><path d="M2 12h25M18 2l10 10-10 10"/></svg> }
            </button>
          </form>
        </section>

        <aside class="login-showcase" aria-label="Beneficios de Coronel Reclamos">
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
        <p>© 2026 Coronel. Todos los derechos reservados.</p>
        <nav aria-label="Enlaces legales"><a href="#">Términos de uso</a><a href="#">Privacidad</a><a href="#">Soporte</a></nav>
      </footer>
    </main>
  `,
  styles: `
    :host{display:block}.login-page{--navy:#061334;--slate:#65718b;min-height:100dvh;position:relative;overflow:hidden;background:#f8f9fb;color:var(--navy);font-family:var(--font-family)}.login-page:before{position:absolute;z-index:0;top:0;left:0;width:66%;height:472px;content:'';background:radial-gradient(circle at 20% 7%,#ffec76 0,transparent 27%),linear-gradient(120deg,#ffd91b 0%,#ffdc23 100%);clip-path:polygon(0 0,100% 0,68% 100%,0 100%)}.login-page:after{position:absolute;bottom:-170px;left:-84px;width:346px;height:346px;border:1px solid #f6edc9;border-radius:50%;content:'';box-shadow:inset 0 0 0 70px #fffdf5}.login-header,.login-shell,.login-footer{position:relative;z-index:1}.login-header{height:112px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(40px,4.4vw,64px)}.header-brand{display:flex;align-items:center;gap:22px;font-size:18px}.header-brand img{width:105px;height:auto}.header-brand span{width:1px;height:29px;background:#1a2740}.header-brand strong{font-weight:800;letter-spacing:-.04em}.help-link{display:flex;align-items:center;gap:9px;color:#677189;font-size:15px;font-weight:600;text-decoration:none}.help-link svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.8}.login-shell{width:min(1092px,calc(100% - 48px));min-height:796px;margin:41px auto 68px;display:grid;grid-template-columns:54.8% 45.2%;overflow:hidden;border:1px solid rgb(255 255 255 / 75%);border-radius:20px;background:#fff;box-shadow:0 32px 55px rgb(30 48 80 / 13%)}.form-panel{display:flex;flex-direction:column;justify-content:center;padding:58px 74px}.desktop-welcome{margin-bottom:34px}.brand-logo{display:block;width:105px;height:auto;margin-bottom:37px}.eyebrow{margin:0 0 9px;color:#66728b;font-size:17px;font-weight:800;letter-spacing:.29em}.form-panel h1{margin:0 0 7px;letter-spacing:-.065em;font-size:52px;line-height:1.08;font-weight:800}.intro{margin:0;color:var(--slate);font-size:20px;letter-spacing:-.035em;line-height:1.45}.form-panel form{display:grid;gap:10px}.form-panel label{margin-top:4px;color:#101a31;font-size:17px;font-weight:800}.input-wrap{position:relative;display:flex;align-items:center;height:64px;margin-bottom:15px;border:1.5px solid #cbd2df;border-radius:14px;background:#fff;transition:border-color .16s ease,box-shadow .16s ease}.input-wrap:focus-within{border-color:#9f8500;box-shadow:0 0 0 4px rgb(255 214 31 / 22%)}.input-wrap>svg{flex:0 0 auto;width:25px;height:25px;margin:0 20px;color:#526078;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.8}.input-wrap input{min-width:0;height:100%;padding:0 14px 0 0;border:0!important;border-radius:14px;background:transparent!important;box-shadow:none!important;color:var(--navy);font:600 16px var(--font-family);outline:0}.input-wrap input::placeholder{color:#78849b;opacity:1}.password-wrap input{padding-right:66px}.password-toggle{position:absolute;right:12px;height:40px;padding:0 3px;border:0;background:transparent;color:#66728a;font:800 16px var(--font-family)}.forgot-password{justify-self:end;margin:-3px 0 25px;color:#006af5;font-size:16px;font-weight:600;letter-spacing:-.04em}.login-button{height:72px;display:flex;align-items:center;justify-content:center;gap:18px;border:0;border-radius:14px;background:linear-gradient(100deg,#ffd41b,#ffdb2b);color:#061334;font:800 20px var(--font-family);letter-spacing:-.045em;transition:filter .16s ease,transform .16s ease}.login-button:not(:disabled):hover{filter:brightness(.98)}.login-button:not(:disabled):active{transform:translateY(1px)}.login-button:disabled{cursor:not-allowed;opacity:.62}.login-button svg{width:29px;height:25px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:2}.login-showcase{position:relative;overflow:hidden;padding:42px 60px;background:radial-gradient(circle at 80% 15%,#fff 0,transparent 40%),linear-gradient(135deg,#fffdf7,#fff9e6)}.login-showcase:after{position:absolute;right:-97px;bottom:-115px;width:255px;height:255px;border-radius:50%;content:'';background:#fff5d7}.claim-illustration{position:relative;width:100%;height:364px}.orb{position:absolute;border-radius:50%;background:linear-gradient(135deg,#fff8d9,#ffefb2)}.orb-one{top:35px;left:27px;width:212px;height:212px}.orb-two{top:196px;right:2px;width:145px;height:145px;background:#fff7dd}.dot-grid{position:absolute;top:24px;right:0;width:98px;height:104px;background:radial-gradient(circle,#ffedb7 3.5px,transparent 4.3px) 0 0/22px 22px}.paper{position:absolute;z-index:2;top:93px;left:87px;width:184px;height:236px;padding:71px 31px 0;border-radius:11px;background:linear-gradient(135deg,#fff 0%,#f2f4fb 100%);box-shadow:10px 14px 18px rgb(42 53 86 / 18%);transform:rotate(6deg)}.paper:after{position:absolute;top:0;right:0;width:36px;height:36px;content:'';background:linear-gradient(135deg,#dce2ef 0 49%,transparent 50%)}.paper b{display:block;width:80px;height:18px;margin:0 auto 20px;border-radius:5px;background:linear-gradient(#ffdd3a,#ffc820);box-shadow:0 2px 3px #b7881b}.paper span{display:block;width:100%;height:11px;margin:0 0 17px;border-radius:999px;background:linear-gradient(90deg,#a2abc2,#c6ccdc)}.paper span:nth-of-type(2){width:78%}.paper span:nth-of-type(3){width:73%}.paper span:nth-of-type(4){width:48%}.shield{position:absolute;z-index:3;top:202px;left:214px;width:108px;height:130px;display:grid;place-items:center;background:linear-gradient(145deg,#ffea4e,#fbc01e);clip-path:polygon(50% 0,94% 14%,90% 65%,50% 100%,10% 65%,6% 14%);filter:drop-shadow(8px 9px 7px rgb(91 69 13 / 23%));transform:rotate(5deg)}.shield svg{width:53px;height:53px;fill:none;stroke:#273654;stroke-linecap:round;stroke-linejoin:round;stroke-width:5}.spark{position:absolute;z-index:3;width:11px;height:35px;border-radius:99px;background:linear-gradient(#ffd926,#ffb40e);box-shadow:0 2px 5px #b78e28;transform:rotate(29deg)}.spark-one{top:195px;left:49px}.spark-two{top:145px;right:28px}.showcase-content{position:relative;z-index:1;margin-top:2px}.showcase-content h2{margin:0 0 13px;font-size:28px;line-height:1.18;font-weight:800;letter-spacing:-.055em}.showcase-content>p{margin:0 0 24px;color:var(--slate);font-size:18px;line-height:1.48;letter-spacing:-.035em}.showcase-content ul{display:grid;gap:12px;margin:0;padding:0;list-style:none;color:#59657b;font-size:16px;font-weight:600}.showcase-content li{display:flex;align-items:center;gap:19px}.showcase-content li>span,.mobile-security span{width:49px;height:49px;display:grid;flex:0 0 auto;place-items:center;border-radius:50%;background:#fff0bd}.showcase-content svg,.mobile-security svg{width:23px;height:23px;fill:none;stroke:#10203b;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.9}.mobile-hero,.mobile-security{display:none}.login-footer{display:flex;align-items:center;justify-content:space-between;padding:0 clamp(40px,4.4vw,64px) 39px;color:#6c778d;font-size:14px;font-weight:600}.login-footer p{margin:0}.login-footer nav{display:flex;gap:39px}.login-footer a{color:inherit;text-decoration:none}.login-footer a+a:before{position:absolute;margin-left:-20px;width:1px;height:23px;content:'';background:#c8ced8;transform:translateY(-2px)}
    @media (max-width:767px){.login-page{min-height:100dvh;background:radial-gradient(circle at 2% 53%,#fff7da 0,transparent 24%),#f7f8fa}.login-page:before{width:100%;height:641px;background:radial-gradient(circle at 16% -2%,#ffed7d 0,transparent 25%),linear-gradient(117deg,#ffdb21,#ffe451);clip-path:polygon(0 0,100% 0,100% 25%,72% 38%,56% 51%,35% 61%,18% 65%,0 58%)}.login-page:after{display:none}.login-header{display:none}.mobile-hero{position:relative;z-index:1;display:block;height:642px;overflow:hidden}.mobile-copy{position:absolute;z-index:3;top:185px;left:10.2%;right:8%}.mobile-logo{display:block;width:186px;height:auto;margin-bottom:37px}.mobile-copy .eyebrow{margin-bottom:19px;font-size:23px;letter-spacing:.3em}.mobile-copy h1{margin:0 0 17px;font-size:56px;line-height:.98;letter-spacing:-.075em}.mobile-copy>p:last-child{margin:0;color:#606e8b;font-size:25px;line-height:1.43;font-weight:600;letter-spacing:-.045em}.mobile-illustration{position:absolute;z-index:2;top:163px;right:-10px;width:49%;height:392px;transform:scale(1.14);transform-origin:top right}.mobile-illustration .orb-one{top:0;left:-10px;width:190px;height:190px}.mobile-illustration .orb-two{top:208px;right:-18px;width:123px;height:123px}.mobile-illustration .paper{top:54px;left:29px;width:172px;height:221px;padding:66px 30px 0}.mobile-illustration .shield{top:150px;left:145px;width:105px;height:126px}.mobile-illustration .spark-one{top:150px;left:-8px}.mobile-illustration .spark-two{top:119px;right:-2px}.login-shell{width:calc(100% - 52px);min-height:0;display:block;margin:0 auto;border:0;border-radius:31px;box-shadow:0 20px 42px rgb(50 67 102 / 10%)}.form-panel{display:block;padding:70px 43px 68px}.desktop-welcome{display:none}.form-panel form{gap:15px}.form-panel label{margin:0 0 0;font-size:28px;letter-spacing:-.055em}.input-wrap{height:111px;margin:0 0 27px;border-width:1.5px;border-radius:21px}.input-wrap>svg{width:38px;height:38px;margin:0 26px 0 37px;stroke-width:1.7}.input-wrap input{font-size:29px;font-weight:500;letter-spacing:-.045em}.password-wrap input{padding-right:95px}.password-toggle{right:23px;height:68px;padding-left:28px;border-left:1px solid #dce1ea;color:#64708a;font-size:29px}.forgot-password{margin:-5px 0 39px;font-size:25px;letter-spacing:-.06em}.login-button{height:118px;gap:24px;border-radius:21px;font-size:30px}.login-button svg{width:39px;height:33px;stroke-width:2}.login-showcase{display:none}.mobile-security{position:relative;z-index:1;display:flex;align-items:center;gap:36px;width:calc(100% - 104px);margin:59px auto 90px;color:#7a869e}.mobile-security span{width:80px;height:80px}.mobile-security svg{width:36px;height:36px}.mobile-security p{margin:0;font-size:22px;line-height:1.42;font-weight:500;letter-spacing:-.045em}.login-footer{display:none}}
    @media (max-width:480px){.mobile-copy{top:126px}.mobile-logo{width:128px;margin-bottom:25px}.mobile-copy .eyebrow{margin-bottom:12px;font-size:16px}.mobile-copy h1{margin-bottom:10px;font-size:42px}.mobile-copy>p:last-child{font-size:18px}.mobile-hero{height:492px}.login-page:before{height:491px}.mobile-illustration{top:115px;transform:scale(.88)}.login-shell{width:calc(100% - 34px);border-radius:25px}.form-panel{padding:48px 28px 45px}.form-panel label{font-size:22px}.input-wrap{height:82px;margin-bottom:20px;border-radius:16px}.input-wrap>svg{width:29px;height:29px;margin:0 18px 0 25px}.input-wrap input{font-size:21px}.password-wrap input{padding-right:70px}.password-toggle{right:16px;height:47px;padding-left:19px;font-size:21px}.forgot-password{margin:-4px 0 28px;font-size:19px}.login-button{height:87px;border-radius:16px;font-size:24px}.login-button svg{width:32px;height:28px}.mobile-security{gap:21px;width:calc(100% - 62px);margin:43px auto 64px}.mobile-security span{width:59px;height:59px}.mobile-security svg{width:27px;height:27px}.mobile-security p{font-size:16px}}
    /*
     * La vista se ajusta al alto disponible del viewport. Esta regla cubre
     * monitores/notebooks de poca altura sin reducir la experiencia móvil.
     */
    @media (min-width:768px) and (max-height:1100px){.login-page{height:100dvh;min-height:640px;overflow:hidden}.login-header{height:76px}.login-shell{height:calc(100dvh - 138px);min-height:620px;margin:16px auto 10px}.login-footer{height:36px;padding:0 clamp(40px,4.4vw,64px);font-size:12px}.form-panel{padding:32px clamp(42px,5vw,68px)}.desktop-welcome{margin-bottom:20px}.brand-logo{margin-bottom:22px}.eyebrow{margin-bottom:5px;font-size:14px}.form-panel h1{margin-bottom:4px;font-size:42px}.intro{font-size:17px}.form-panel form{gap:6px}.form-panel label{font-size:15px}.input-wrap{height:54px;margin-bottom:8px;border-radius:12px}.input-wrap>svg{width:22px;height:22px;margin:0 16px}.input-wrap input,.password-toggle{font-size:15px}.forgot-password{margin:-2px 0 15px;font-size:14px}.login-button{height:58px;font-size:18px}.login-showcase{padding:25px 46px}.claim-illustration{height:246px}.claim-illustration>.orb-one{top:22px;left:19px;transform:scale(.75);transform-origin:top left}.claim-illustration>.orb-two{top:148px;right:-14px;transform:scale(.72);transform-origin:top right}.dot-grid{top:5px;transform:scale(.75);transform-origin:top right}.paper{top:60px;left:64px;transform:rotate(6deg) scale(.76);transform-origin:top left}.shield{top:143px;left:160px;transform:rotate(5deg) scale(.76);transform-origin:top left}.spark-one{top:137px;left:35px}.spark-two{top:100px;right:19px}.showcase-content{margin-top:0}.showcase-content h2{margin-bottom:7px;font-size:23px}.showcase-content>p{margin-bottom:12px;font-size:15px}.showcase-content ul{gap:7px;font-size:14px}.showcase-content li{gap:13px}.showcase-content li>span{width:38px;height:38px}.showcase-content svg{width:19px;height:19px}.login-footer nav{gap:30px}.login-footer a+a:before{margin-left:-15px;height:18px}}
    @media (min-width:768px){.form-panel{justify-content:flex-start;padding-top:clamp(58px,8vh,96px)}.desktop-welcome{margin-bottom:30px}}
    @media (min-width:481px) and (max-width:767px){.mobile-hero{height:530px}.login-page:before{height:529px}.mobile-copy{top:170px}.mobile-logo{width:135px;margin-bottom:20px}.mobile-illustration{top:105px}}
    @media (max-width:480px){.mobile-hero{height:375px}.login-page:before{height:374px}.mobile-copy{top:110px}.mobile-logo{width:100px;margin-bottom:16px}.mobile-illustration{top:72px}}
  `,
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
