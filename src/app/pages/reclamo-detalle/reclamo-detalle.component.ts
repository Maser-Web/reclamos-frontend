import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReclamosService } from '../../core/Services/reclamos.service';
import { ClientesService, UsuariosService } from '../../core/Services/catalogos.service';
import { AppButtonComponent, AppHeaderComponent, AppIconComponent, StatusBadgeComponent } from '../../core/components/ui';
import { Reclamo } from '../../core/interfaces/models';

@Component({
  standalone: true,
  imports: [AppHeaderComponent, AppButtonComponent, AppIconComponent, StatusBadgeComponent],
  template: `<app-header title="Reclamo" [showBack]="true" (back)="back()"/>
    @if(reclamo(); as r) {<section class="page"><article class="detail-card">
      <div class="split"><app-status-badge [status]="r.estado"/><time>{{date(r.fechaCreacion)}}</time></div>
      <h2>{{r.asunto}}</h2><p>{{r.descripcion}}</p>
      <div class="info"><app-icon name="user-round"/><div><span>Cliente</span><b>{{client(r)}}</b><small>{{cuit(r)}}</small></div></div>
      <div class="info"><app-icon name="file-text"/><div><span>Área asignada</span><b>{{area(r)}}</b><small>Asignado a: {{responsable(r)}}</small></div></div>
      <div class="dates"><span>Creación<br/><b>{{date(r.fechaCreacion)}}</b></span><span>Actualización<br/><b>{{date(r.fechaActualizacion)}}</b></span></div>
      @if(r.archivos.length) {<h3>Archivos del cliente</h3><div class="files">@for(file of r.archivos; track file.id) {<div><app-icon name="file-text"/><span>{{file.nombre}}<small>{{file.tamano}}</small></span></div>}</div>}
    </article><div class="actions"><app-button label="Comentar" icon="message-circle" (click)="go('comentar')"/><app-button label="Derivar" icon="arrow-right" (click)="go('derivar')"/><app-button label="Cerrar" icon="check" (click)="go('cerrar')"/></div><app-button label="Ver seguimiento" icon="clipboard-list" (click)="go('seguimiento')"/></section>}`,
  styles: `.detail-card{background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:22px}.split,.dates{display:flex;justify-content:space-between;gap:12px}.split time,p,small,span{color:var(--color-text-secondary)}h2{font-size:var(--font-xl);margin:24px 0 8px}p{font-size:var(--font-md);margin:0 0 22px}.info{border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;display:flex;gap:14px;margin-top:12px}.info div{display:grid;gap:4px}.info b,.info small{display:block}.dates{margin-top:14px;padding:16px;border:1px solid var(--color-border);border-radius:var(--radius-md);font-size:var(--font-sm)}.files,.actions{display:flex;gap:10px;margin-top:14px}.files>div{flex:1;border:1px solid var(--color-border);padding:10px;display:flex;gap:6px}.files small{display:block}.actions app-button{flex:1}.actions .app-button{font-size:12px;padding:6px}`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReclamoDetalleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ReclamosService);
  private readonly clients = inject(ClientesService);
  private readonly users = inject(UsuariosService);
  readonly router = inject(Router);
  readonly reclamo = signal<Reclamo | undefined>(undefined);
  constructor() { this.service.detail(this.id()).subscribe(item => this.reclamo.set(item)); }
  client(reclamo: Reclamo): string { return this.clients.get(reclamo.clienteId)?.nombre ?? 'Cliente'; }
  cuit(reclamo: Reclamo): string { return this.clients.get(reclamo.clienteId)?.cuit ?? ''; }
  area(reclamo: Reclamo): string { return reclamo.areaId ?? 'Sin asignar'; }
  responsable(reclamo: Reclamo): string { return reclamo.responsableId === this.users.current().id ? 'María González' : reclamo.responsableId ? 'Responsable asignado' : 'Sin asignar'; }
  date(value: string): string { return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)); }
  go(action: string): void { this.router.navigate(['/reclamos', this.reclamo()?.id, action]); }
  back(): void { this.router.navigateByUrl('/reclamos'); }
  private id(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }
}
