import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppButtonComponent, AppHeaderComponent, AppIconComponent } from '../../core/components/ui';
import { NotificationService } from '../../core/Services/notification.service';
import { ReclamosService } from '../../core/Services/reclamos.service';
import { UsuarioService } from '../../core/Services/usuario.service';

interface UsuarioDerivable {
  codigo: number;
  nombre: string;
}

@Component({
  standalone: true,
  imports: [AppButtonComponent, AppHeaderComponent, AppIconComponent],
  template: `
    <app-header title="Derivar reclamo" [showBack]="true" (back)="back()" />
    <section class="derive-page" aria-labelledby="derive-title">
      <header class="derive-intro">
        <span class="derive-icon"><app-icon name="user-round" [size]="27" /></span>
        <div><h1 id="derive-title">Derivar reclamo</h1><p>Seleccioná la persona responsable del reclamo #{{ reclamoId }}.</p></div>
      </header>

      <label for="user-search">Buscar usuario</label>
      <div class="search-field"><app-icon name="search" [size]="20" /><input id="user-search" type="search" [value]="query()" (input)="search($any($event.target).value)" autocomplete="off" placeholder="Nombre o código de usuario" /></div>
      <p class="search-help">Ingresá al menos 2 letras o un código para buscar.</p>

      @if (loading()) {
        <section class="lookup-state" role="status">Cargando usuarios disponibles…</section>
      } @else if (loadError()) {
        <section class="lookup-state" role="alert"><p>No pudimos cargar los usuarios.</p><button type="button" class="retry" (click)="loadUsers(true)">Reintentar</button></section>
      } @else if (selected(); as usuario) {
        <ul class="user-results" aria-label="Usuario seleccionado">
          <li><button type="button" class="selected" aria-label="Quitar selección para elegir otro usuario" title="Tocá para elegir otro usuario" (click)="select(usuario)"><span class="avatar">{{ initials(usuario.nombre) }}</span><span><b>{{ usuario.nombre }}</b><small>Código #{{ usuario.codigo }}</small></span><app-icon name="check" [size]="20" /></button></li>
        </ul>
      } @else if (!canSearch()) {
        <section class="lookup-state">Buscá un usuario para asignarlo al reclamo.</section>
      } @else if (!results().length) {
        <section class="lookup-state">No encontramos usuarios para esa búsqueda.</section>
      } @else {
        <ul class="user-results" aria-label="Usuarios encontrados">
          @for (usuario of results(); track usuario.codigo) {
            <li><button type="button" [class.selected]="selected()?.codigo === usuario.codigo" (click)="select(usuario)"><span class="avatar">{{ initials(usuario.nombre) }}</span><span><b>{{ usuario.nombre }}</b><small>Código #{{ usuario.codigo }}</small></span><app-icon [name]="selected()?.codigo === usuario.codigo ? 'check' : 'chevron-right'" [size]="20" /></button></li>
          }
        </ul>
      }

      @if (selected(); as usuario) {<p class="selection" aria-live="polite"><app-icon name="check" [size]="18" />{{ usuario.nombre }} recibirá este reclamo.</p>}
      <div class="actions"><app-button label="Confirmar derivación" icon="check" [disabled]="!selected() || saving()" (click)="confirm()" /><button type="button" class="cancel" (click)="back()">Cancelar</button></div>
    </section>
  `,
  styleUrl: './reclamo-derivar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamoDerivarComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reclamos = inject(ReclamosService);
  private readonly usuariosService = inject(UsuarioService);
  private readonly notifications = inject(NotificationService);

  readonly reclamoId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly query = signal('');
  readonly selected = signal<UsuarioDerivable | null>(null);
  readonly usuarios = signal<UsuarioDerivable[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal(false);
  readonly canSearch = computed(() => {
    const value = this.query().trim();
    return /^\d+$/.test(value) ? value.length > 0 : value.length >= 2;
  });
  readonly results = computed(() => {
    if (!this.canSearch()) return [];
    const value = this.query().trim().toLocaleLowerCase('es-AR');
    return this.usuarios().filter(usuario =>
      usuario.nombre.toLocaleLowerCase('es-AR').includes(value) || String(usuario.codigo).includes(value),
    );
  });

  constructor() { this.loadUsers(); }

  loadUsers(forceRefresh = false): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.usuariosService.listar({ forceRefresh }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: usuarios => this.usuarios.set(usuarios.map(usuario => ({
        codigo: usuario.usuCodigo,
        nombre: usuario.usuNombre?.trim() || `Usuario ${usuario.usuCodigo}`,
      }))),
      error: () => this.loadError.set(true),
    });
  }

  search(value: string): void { this.query.set(value); this.selected.set(null); }
  /** Al elegir un usuario solo él queda visible; tocarlo de nuevo vuelve a mostrar los resultados. */
  select(usuario: UsuarioDerivable): void { this.selected.set(this.selected()?.codigo === usuario.codigo ? null : usuario); }
  initials(nombre: string): string { return nombre.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
  back(): void { void this.router.navigate(['/reclamos', this.reclamoId]); }

  confirm(): void {
    const usuario = this.selected();
    if (!usuario || this.saving()) return;
    this.saving.set(true);
    this.reclamos.derivar(this.reclamoId, usuario.codigo).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => void this.notifications.success('Reclamo derivado', `Se asignó a ${usuario.nombre}.`).then(() => this.back()),
      error: () => void this.notifications.error('No se pudo derivar el reclamo', 'Intentá nuevamente.'),
    });
  }
}
