import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, filter, finalize, map, of, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { AuthService } from '../../core/Services/auth.service';
import { ReclamosApiService } from '../../core/Services/reclamos-api.service';
import { ClientesService } from '../../core/Services/clientes.service';
import { MotivosReclamosService } from '../../core/Services/motivos-reclamos.service';
import { AppButtonComponent, AppHeaderComponent, AppIconComponent } from '../../core/components/ui';
import { NotificationService } from '../../core/Services/notification.service';
import { Cliente } from '../../core/interfaces/cliente.interface';
import { MotivoReclamo } from '../../core/interfaces/motivo-reclamo.interface';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, AppButtonComponent, AppHeaderComponent, AppIconComponent],
  template: `
    <app-header title="Nuevo reclamo" [showBack]="true" (back)="back()" />
    <main class="page">
      <form class="new-claim-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <header><h2>Ingresá tu reclamo</h2><p>Describí el inconveniente.</p></header>
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
        <section class="motivo-field">
          <label for="motivo">Motivo *</label>
          @if (loadingMotivos()) {
            <p class="status" role="status">Cargando motivos de apertura…</p>
          } @else if (motivosError(); as error) {
            <section class="status error" role="alert"><app-icon name="circle-alert" [size]="18"/><span>{{ error }}</span><button type="button" (click)="loadMotivos(true)">Reintentar</button></section>
          } @else {
            <div class="motivo-picker"><button id="motivo" type="button" class="motivo-trigger" [attr.aria-expanded]="motivosMenuOpen()" aria-haspopup="listbox" aria-label="Seleccionar motivo" (click)="toggleMotivosMenu()"><span [class.placeholder]="!selectedMotivoLabel()">{{ selectedMotivoLabel() || 'Seleccioná un motivo' }}</span><app-icon name="chevron-down" [size]="18"/></button>@if (motivosMenuOpen()) {<ul class="motivo-options" role="listbox" aria-label="Motivos de apertura">@for (motivo of motivos(); track motivo.mtrCodigo) {<li><button type="button" role="option" [attr.aria-selected]="form.controls.motivo.value === motivo.mtrDescri" [class.selected]="form.controls.motivo.value === motivo.mtrDescri" (click)="selectMotivo(motivo)"><span>{{ motivo.mtrDescri }}</span><app-icon name="check" [size]="17"/></button></li>}</ul>}</div>
            @if (!motivos().length) { <p class="status error" role="alert"><app-icon name="circle-alert" [size]="18"/>No hay motivos de apertura disponibles.</p> }
          }
          <div id="motivo-help" class="field-help">@if (showError('motivo')) { <b>Seleccioná un motivo válido.</b> }</div>
        </section>
          <label class="file-picker" for="archivos"><app-icon name="paperclip" [size]="20"/><span><b>Seleccionar archivos</b><small>Podés elegir uno o más documentos.</small></span></label>
          <input id="archivos" class="file-input" type="file" multiple (change)="onFilesSelected($any($event.target).files)" aria-describedby="archivos-help" />
          <div id="archivos-help" class="file-help">@if (selectedFiles().length) {<span>{{ selectedFiles().length }} archivo(s) seleccionado(s)</span><ul>@for (file of selectedFiles(); track file.name + file.size) {<li><app-icon name="paperclip" [size]="14"/>{{ file.name }}</li>}</ul>} @else {<span>Sin archivos seleccionados.</span>}</div>
        @if (sessionError(); as error) { <p class="status error" role="alert"><app-icon name="circle-alert" [size]="18"/>{{ error }}</p> }
        <app-button type="submit" label="Crear reclamo" icon="plus" [disabled]="form.invalid || loadingMotivos() || !!motivosError() || !motivos().length || saving()" />
      </form>
    </main>
  `,
  styleUrl: './reclamo-nuevo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamoNuevoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ReclamosApiService);
  private readonly clientesService = inject(ClientesService);
  private readonly motivosService = inject(MotivosReclamosService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly motivos = signal<MotivoReclamo[]>([]);
  readonly loadingMotivos = signal(false);
  readonly motivosError = signal<string | null>(null);
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
  readonly motivosMenuOpen = signal(false);
  readonly form = this.fb.nonNullable.group({ cliente: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]], motivo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)]] });
  private readonly clientSearchRequests = new Subject<string>();
  private readonly cancelClientSearch = new Subject<void>();
  private loadMoreSubscription: Subscription | null = null;
  private readonly clientPageSize = 20;

  constructor() {
    this.loadMotivos();
    this.clientSearchRequests.pipe(
      map(value => value.trim()),
      debounceTime(350),
      distinctUntilChanged(),
      filter(query => this.isClientSearchValid(query)),
      switchMap(query => {
        this.loadingClients.set(true);
        this.clientsError.set(null);
        return this.clientesService.buscar(query, this.clientPageSize, 0).pipe(
          map(response => ({ query, response, error: null as unknown })),
          catchError(error => of({ query, response: null, error })),
          takeUntil(this.cancelClientSearch),
          finalize(() => {
            if (this.clientSearch().trim() === query) this.loadingClients.set(false);
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(result => {
      if (result.error) {
        this.clientsError.set(this.apiErrorMessage(result.error, 'No pudimos buscar los clientes. Intentá nuevamente.'));
        return;
      }
      const clients = result.response?.data ?? [];
      this.clients.set(this.validClients(clients));
      this.hasMoreClients.set(clients.length === this.clientPageSize);
    });
  }

  loadMotivos(forceRefresh = false): void {
    this.loadingMotivos.set(true); this.motivosError.set(null);
    this.motivosService.apertura({ forceRefresh }).pipe(finalize(() => this.loadingMotivos.set(false))).subscribe({
      next: motivos => this.motivos.set(motivos),
      error: error => this.motivosError.set(this.apiErrorMessage(error, 'No pudimos cargar los motivos de apertura. Intentá nuevamente.')),
    });
  }

  onClientSearch(value: string): void {
    const query = value.trim();
    this.clientSearch.set(value);
    this.selectedClient.set(null);
    this.form.controls.cliente.setValue('');
    this.clients.set([]); this.clientsError.set(null); this.hasMoreClients.set(false); this.loadingClients.set(false); this.loadingMoreClients.set(false);
    this.cancelClientSearch.next();
    this.loadMoreSubscription?.unsubscribe();
    this.loadMoreSubscription = null;
    this.clientSearchRequests.next(value);
    if (!this.isClientSearchValid(query)) { this.loadingClients.set(false); return; }
  }

  loadMoreClients(): void {
    const query = this.clientSearch().trim();
    if (!this.hasMoreClients() || this.loadingMoreClients() || !this.isClientSearchValid(query)) return;
    this.loadingMoreClients.set(true);
    this.clientsError.set(null);
    this.loadMoreSubscription = this.clientesService.buscar(query, this.clientPageSize, this.clients().length).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: response => {
        const clients = response.data ?? [];
        this.clients.set([...this.clients(), ...this.validClients(clients)]);
        this.hasMoreClients.set(clients.length === this.clientPageSize);
      },
      error: error => this.clientsError.set(this.apiErrorMessage(error, 'No pudimos buscar los clientes. Intentá nuevamente.')),
      complete: () => this.loadingMoreClients.set(false),
    });
  }

  selectClient(client: Cliente): void {
    this.cancelClientSearch.next();
    this.loadMoreSubscription?.unsubscribe();
    this.loadMoreSubscription = null;
    this.clientSearchRequests.next('');
    this.selectedClient.set(client);
    this.clientSearch.set(this.clientLabel(client));
    this.form.controls.cliente.setValue(String(client.cliCodigo));
    this.clients.set([]); this.hasMoreClients.set(false); this.clientsError.set(null); this.loadingClients.set(false); this.loadingMoreClients.set(false);
  }

  toggleMotivosMenu(): void { if (this.motivos().length) this.motivosMenuOpen.update(open => !open); }
  selectMotivo(motivo: MotivoReclamo): void { this.form.controls.motivo.setValue(motivo.mtrDescri); this.form.controls.motivo.markAsTouched(); this.motivosMenuOpen.set(false); }
  selectedMotivoLabel(): string { return this.form.controls.motivo.value; }

  canSearchClients(): boolean { return this.isClientSearchValid(this.clientSearch().trim()); }

  onFilesSelected(files: FileList | null): void { this.selectedFiles.set(files ? Array.from(files) : []); }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true); this.sessionError.set(null);
    const value = this.form.getRawValue();
    this.api.crearReclamo({ motivo: value.motivo.trim(), usu_codigo: Number(value.cliente) }).subscribe({
      next: () => { void this.notifications.success('Reclamo creado', 'El reclamo fue registrado correctamente.'); void this.router.navigateByUrl('/reclamos'); },
      error: error => { this.saving.set(false); void this.notifications.error('No se pudo crear el reclamo', this.apiErrorMessage(error, 'Ocurrió un error inesperado. Intentá nuevamente.')); },
      complete: () => this.saving.set(false),
    });
  }

  back(): void { void this.router.navigateByUrl('/reclamos'); }
  showError(control: 'cliente' | 'motivo'): boolean { const field = this.form.controls[control]; return field.touched && field.invalid; }
  clientLabel(client: Cliente): string { return `${client.cliCodigo} — ${client.cliNombre}`; }
  private validClients(clients: Cliente[]): Cliente[] {
    return clients.filter(client => Number.isInteger(client.cliCodigo) && client.cliCodigo > 0 && Boolean(client.cliNombre?.trim()));
  }
  private isClientSearchValid(query: string): boolean {
    return /^\d+$/.test(query) ? !/^0+$/.test(query) : query.length >= 2;
  }
  private apiErrorMessage(error: unknown, fallback: string): string { if (typeof error === 'object' && error !== null && 'error' in error) { const body = error.error; if (typeof body === 'object' && body !== null && 'mensaje' in body && typeof body.mensaje === 'string') return body.mensaje; } return fallback; }
}
