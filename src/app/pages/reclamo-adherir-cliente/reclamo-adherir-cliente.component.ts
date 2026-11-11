import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppButtonComponent, AppIconComponent } from '../../core/components/ui';
import { NotificationService } from '../../core/Services/notification.service';
import { UsuarioService } from '../../core/Services/usuario.service';

interface UsuarioAdherible { codigo: number; nombre: string; }

@Component({
  standalone: true,
  imports: [AppButtonComponent, AppIconComponent],
  template: `
    <main class="adherir-page">
      <header class="adherir-header">
        <button type="button" aria-label="Volver al detalle del reclamo" (click)="back()"><app-icon name="chevron-left" [size]="27" /></button>
        <span class="maser-wordmark" aria-label="Maser LINK"><b>Maser</b><strong>LINK</strong></span>
        <span aria-hidden="true"></span>
      </header>
      <section class="adherir-shell" aria-labelledby="adherir-title">
        <header><span class="header-icon"><app-icon name="user-round" [size]="28" /></span><div><h1 id="adherir-title">Adherir cliente</h1><p>Buscá el usuario que querés asociar al reclamo #{{ reclamoId }}.</p></div></header>
        <label for="usuario-search">Buscar usuario</label>
        <div class="search-field"><app-icon name="search" [size]="21" /><input id="usuario-search" type="search" [value]="query()" (input)="search($any($event.target).value)" autocomplete="off" placeholder="Nombre o código de usuario" /></div>
        <p class="search-help">Ingresá al menos 2 letras o un código para buscar.</p>
        @if (loading()) {
          <section class="search-state" aria-live="polite"><p>Cargando usuarios disponibles…</p></section>
        } @else if (loadError()) {
          <section class="search-state" aria-live="polite"><app-icon name="circle-alert" [size]="25" /><p>No pudimos cargar los usuarios.</p><button type="button" class="retry" (click)="loadUsers(true)">Reintentar</button></section>
        } @else if (!canSearch()) {
          <section class="search-state" aria-live="polite"><app-icon name="search" [size]="25" /><p>Empezá a escribir para ver usuarios disponibles.</p></section>
        } @else if (!results().length) {
          <section class="search-state" aria-live="polite"><app-icon name="circle-alert" [size]="25" /><p>No encontramos usuarios para esa búsqueda.</p></section>
        } @else {
          <ul class="user-results" aria-label="Usuarios encontrados">@for (usuario of results(); track usuario.codigo) {<li><button type="button" [class.selected]="selected()?.codigo === usuario.codigo" (click)="select(usuario)"><span class="avatar" aria-hidden="true">{{ initials(usuario.nombre) }}</span><span><b>{{ usuario.nombre }}</b><small>Código #{{ usuario.codigo }}</small></span><app-icon [name]="selected()?.codigo === usuario.codigo ? 'check' : 'chevron-right'" [size]="20" /></button></li>}</ul>
        }
        @if (selected(); as usuario) {<section class="selection" aria-live="polite"><app-icon name="check" [size]="20" /><span><b>{{ usuario.nombre }}</b> será adherido a este reclamo.</span></section>}
        <div class="actions"><app-button label="Confirmar adhesión" icon="check" [disabled]="!selected()" (click)="confirm()" /><button type="button" class="cancel" (click)="back()">Cancelar</button></div>
      </section>
    </main>
  `,
  styleUrl: './reclamo-adherir-cliente.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamoAdherirClienteComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly usuariosService = inject(UsuarioService);
  readonly reclamoId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly query = signal('');
  readonly selected = signal<UsuarioAdherible | null>(null);
  readonly usuarios = signal<UsuarioAdherible[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly canSearch = computed(() => { const value = this.query().trim(); return /^\d+$/.test(value) ? value.length > 0 : value.length >= 2; });
  readonly results = computed(() => { if (!this.canSearch()) return []; const value = this.query().trim().toLocaleLowerCase('es-AR'); return this.usuarios().filter(usuario => usuario.nombre.toLocaleLowerCase('es-AR').includes(value) || String(usuario.codigo).includes(value)); });

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
  select(usuario: UsuarioAdherible): void { this.selected.set(usuario); }
  initials(nombre: string): string { return nombre.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
  back(): void { void this.router.navigate(['/reclamos', this.reclamoId]); }
  confirm(): void { const usuario = this.selected(); if (!usuario) return; void this.notifications.success('Cliente adherido', `${usuario.nombre} fue asociado visualmente al reclamo #${this.reclamoId}.`).then(() => this.back()); }
}
