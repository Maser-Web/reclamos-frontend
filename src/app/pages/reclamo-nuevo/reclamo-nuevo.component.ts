import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/Services/auth.service';
import { ReclamosApiService } from '../../core/Services/reclamos-api.service';
import { ClientesService } from '../../core/Services/clientes.service';
import { AppButtonComponent, AppHeaderComponent, AppIconComponent } from '../../core/components/ui';
import { NotificationService } from '../../core/Services/notification.service';
import { Servicio } from '../../core/interfaces/servicio.interface';
import { Cliente } from '../../core/interfaces/cliente.interface';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, AppButtonComponent, AppHeaderComponent, AppIconComponent],
  template: `
    <app-header title="Nuevo reclamo" [showBack]="true" (back)="back()" />
    <main class="page">
      <form class="new-claim-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <header><h2>Ingresá tu reclamo</h2><p>Describí el inconveniente y seleccioná el servicio involucrado.</p></header>
        <label for="cliente-busqueda">¿A quién corresponde? *</label>
        <input id="cliente-busqueda" type="search" [value]="clientSearch()" (input)="onClientSearch($any($event.target).value)" autocomplete="off" placeholder="Buscá por nombre o código" aria-describedby="cliente-help" />
        <input type="hidden" formControlName="cliente" />
        <div id="cliente-help" class="field-help"><span>Ingresá al menos 2 letras o un código.</span>@if (selectedClient(); as client) {<b>Seleccionado: {{ clientLabel(client) }}</b>}</div>
        @if (loadingClients()) {
          <p class="status" role="status">Buscando clientes…</p>
        } @else if (clientsError(); as error) {
          <section class="status error" role="alert"><app-icon name="circle-alert" [size]="18"/><span>{{ error }}</span></section>
        } @else if (canSearchClients() && !selectedClient() && !clients().length) {
          <p class="status" role="status">Sin resultados</p>
        } @else if (clients().length) {
          <ul class="client-results" aria-label="Resultados de clientes">@for (client of clients(); track client.cliCodigo) {<li><button type="button" (click)="selectClient(client)"><span class="client-code">#{{ client.cliCodigo }}</span><span class="client-name">{{ client.cliNombre }}</span></button></li>}</ul>
          @if (hasMoreClients()) {<button class="load-more" type="button" (click)="loadMoreClients()" [disabled]="loadingMoreClients()">{{ loadingMoreClients() ? 'Cargando…' : 'Cargar más' }}</button>}
        }
        @if (showError('cliente')) { <p class="field-error">Seleccioná un cliente válido.</p> }
        <label for="motivo">Motivo *</label>
        <textarea id="motivo" formControlName="motivo" maxlength="1000" placeholder="Contanos cuál es el inconveniente..." aria-describedby="motivo-help"></textarea>
        <div id="motivo-help" class="field-help"><span>{{ form.controls.motivo.value.length }}/1000</span>@if (showError('motivo')) { <b>El motivo es obligatorio y no puede contener solo espacios.</b> }</div>
        <label for="servicio">Servicio *</label>
        @if (loadingServices()) {
          <p class="status" role="status">Cargando servicios…</p>
        } @else if (servicesError(); as error) {
          <section class="status error" role="alert"><app-icon name="circle-alert" [size]="18"/><span>{{ error }}</span><button type="button" (click)="loadServices()">Reintentar</button></section>
        } @else {
          <div class="service-picker"><button id="servicio" type="button" class="service-trigger" [attr.aria-expanded]="servicesMenuOpen()" aria-label="Seleccionar servicio" (click)="toggleServicesMenu()"><span>{{ selectedServiceLabel() || 'Seleccioná un servicio' }}</span><app-icon name="chevron-down" [size]="18"/></button>@if (servicesMenuOpen()) {<ul class="service-options" role="listbox" aria-label="Servicios disponibles">@for (service of services(); track service.serCodigo) {<li><button type="button" [class.selected]="form.controls.servicio.value === service.serCodigo" (click)="selectService(service)">{{ serviceLabel(service) }}</button></li>}</ul>}</div>
          @if (!services().length) { <p class="status error" role="alert"><app-icon name="circle-alert" [size]="18"/>No hay servicios disponibles para seleccionar.</p> }
          @if (showError('servicio')) { <p class="field-error">Seleccioná un servicio válido.</p> }
        }
        <section class="file-upload" aria-labelledby="archivos-label">
          <label id="archivos-label" for="archivos">Adjuntar archivos <span>Opcional</span></label>
          <label class="file-picker" for="archivos"><app-icon name="paperclip" [size]="20"/><span><b>Seleccionar archivos</b><small>Podés elegir uno o más documentos.</small></span></label>
          <input id="archivos" class="file-input" type="file" multiple (change)="onFilesSelected($any($event.target).files)" aria-describedby="archivos-help" />
          <div id="archivos-help" class="file-help">@if (selectedFiles().length) {<span>{{ selectedFiles().length }} archivo(s) seleccionado(s)</span><ul>@for (file of selectedFiles(); track file.name + file.size) {<li><app-icon name="paperclip" [size]="14"/>{{ file.name }}</li>}</ul>} @else {<span>Sin archivos seleccionados.</span>}</div>
        </section>
        @if (sessionError(); as error) { <p class="status error" role="alert"><app-icon name="circle-alert" [size]="18"/>{{ error }}</p> }
        <app-button type="submit" label="Crear reclamo" icon="plus" [disabled]="form.invalid || loadingServices() || !!servicesError() || !services().length || saving()" />
      </form>
    </main>
  `,
  styleUrl: './reclamo-nuevo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamoNuevoComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ReclamosApiService);
  private readonly clientesService = inject(ClientesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  readonly services = signal<Servicio[]>([]);
  readonly loadingServices = signal(false);
  readonly servicesError = signal<string | null>(null);
  readonly clients = signal<Cliente[]>([]);
  readonly clientSearch = signal('');
  readonly selectedClient = signal<Cliente | null>(null);
  readonly loadingClients = signal(false);
  readonly loadingMoreClients = signal(false);
  readonly hasMoreClients = signal(false);
  readonly clientsError = signal<string | null>(null);
  readonly sessionError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly selectedFiles = signal<File[]>([]);
  readonly servicesMenuOpen = signal(false);
  readonly form = this.fb.nonNullable.group({ cliente: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]], motivo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)]], servicio: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]] });
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private searchRequest = 0;
  private readonly clientPageSize = 20;

  constructor() { this.loadServices(); }

  loadServices(): void {
    this.loadingServices.set(true); this.servicesError.set(null);
    this.api.obtenerServicios().subscribe({
      next: services => this.services.set((services ?? []).filter(service => /^[1-9]\d*$/.test(service.serCodigo))),
      error: error => this.servicesError.set(this.apiErrorMessage(error, 'No pudimos cargar los servicios. Intentá nuevamente.')),
      complete: () => this.loadingServices.set(false),
    });
  }

  onClientSearch(value: string): void {
    const query = value.trim();
    this.clientSearch.set(value);
    this.selectedClient.set(null);
    this.form.controls.cliente.setValue('');
    this.clients.set([]); this.clientsError.set(null); this.hasMoreClients.set(false); this.loadingClients.set(false); this.loadingMoreClients.set(false);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const request = ++this.searchRequest;
    if (!this.isClientSearchValid(query)) { this.loadingClients.set(false); return; }
    this.searchTimer = setTimeout(() => this.searchClients(query, 0, request), 350);
  }

  loadMoreClients(): void {
    const query = this.clientSearch().trim();
    if (!this.hasMoreClients() || this.loadingMoreClients() || !this.isClientSearchValid(query)) return;
    this.searchClients(query, this.clients().length, ++this.searchRequest);
  }

  selectClient(client: Cliente): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    ++this.searchRequest;
    this.selectedClient.set(client);
    this.clientSearch.set(this.clientLabel(client));
    this.form.controls.cliente.setValue(String(client.cliCodigo));
    this.clients.set([]); this.hasMoreClients.set(false); this.clientsError.set(null); this.loadingClients.set(false); this.loadingMoreClients.set(false);
  }

  toggleServicesMenu(): void { if (this.services().length) this.servicesMenuOpen.update(open => !open); }
  selectService(service: Servicio): void { this.form.controls.servicio.setValue(service.serCodigo); this.form.controls.servicio.markAsTouched(); this.servicesMenuOpen.set(false); }
  selectedServiceLabel(): string { const service = this.services().find(item => item.serCodigo === this.form.controls.servicio.value); return service ? this.serviceLabel(service) : ''; }

  canSearchClients(): boolean { return this.isClientSearchValid(this.clientSearch().trim()); }

  onFilesSelected(files: FileList | null): void { this.selectedFiles.set(files ? Array.from(files) : []); }

  ngOnDestroy(): void { if (this.searchTimer) clearTimeout(this.searchTimer); ++this.searchRequest; }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loadingServices() || this.servicesError() || !this.services().length) return;
    this.saving.set(true); this.sessionError.set(null);
    const value = this.form.getRawValue();
    this.api.crearReclamo({ motivo: value.motivo.trim(), usu_codigo: Number(value.cliente), servicio: Number(value.servicio) }).subscribe({
      next: () => { void this.notifications.success('Reclamo creado', 'El reclamo fue registrado correctamente.'); void this.router.navigateByUrl('/reclamos'); },
      error: error => { this.saving.set(false); void this.notifications.error('No se pudo crear el reclamo', this.apiErrorMessage(error, 'Ocurrió un error inesperado. Intentá nuevamente.')); },
      complete: () => this.saving.set(false),
    });
  }

  back(): void { void this.router.navigateByUrl('/reclamos'); }
  showError(control: 'cliente' | 'motivo' | 'servicio'): boolean { const field = this.form.controls[control]; return field.touched && field.invalid; }
  clientLabel(client: Cliente): string { return `${client.cliCodigo} — ${client.cliNombre}`; }
  serviceLabel(service: Servicio): string { return `${service.serCodigo} — ${service.serDescri?.trim() || 'Sin descripción'}`; }
  private searchClients(query: string, offset: number, request: number): void {
    if (offset === 0) this.loadingClients.set(true); else this.loadingMoreClients.set(true);
    this.clientsError.set(null);
    this.clientesService.buscar(query, this.clientPageSize, offset).subscribe({
      next: response => {
        if (request !== this.searchRequest) return;
        const clients = response.data ?? [];
        const validClients = clients.filter(client => Number.isInteger(client.cliCodigo) && client.cliCodigo > 0 && Boolean(client.cliNombre?.trim()));
        this.clients.set(offset === 0 ? validClients : [...this.clients(), ...validClients]);
        this.hasMoreClients.set(clients.length === this.clientPageSize);
      },
      error: error => {
        if (request === this.searchRequest) this.clientsError.set(this.apiErrorMessage(error, 'No pudimos buscar los clientes. Intentá nuevamente.'));
      },
      complete: () => {
        if (request !== this.searchRequest) return;
        this.loadingClients.set(false); this.loadingMoreClients.set(false);
      },
    });
  }
  private isClientSearchValid(query: string): boolean {
    return /^\d+$/.test(query) ? !/^0+$/.test(query) : query.length >= 2;
  }
  private apiErrorMessage(error: unknown, fallback: string): string { if (typeof error === 'object' && error !== null && 'error' in error) { const body = error.error; if (typeof body === 'object' && body !== null && 'mensaje' in body && typeof body.mensaje === 'string') return body.mensaje; } return fallback; }
}
