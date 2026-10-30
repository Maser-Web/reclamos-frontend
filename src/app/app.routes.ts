import { Routes } from '@angular/router';
import { MobileLayoutComponent } from './core/components/mobile-layout.component';
import { authGuard } from './core/Guards/auth.guard';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'registro', loadComponent: () => import('./pages/registro/registro.component').then(m => m.RegistroComponent) },
  { path: '', component: MobileLayoutComponent, canActivateChild: [authGuard], children: [
    { path: 'reclamos/nuevo', loadComponent: () => import('./pages/reclamo-nuevo/reclamo-nuevo.component').then(m => m.ReclamoNuevoComponent) },
    { path: 'notificaciones', loadComponent: () => import('./pages/notificaciones/notificaciones.component').then(m => m.NotificacionesComponent) },
    { path: 'reclamos', loadComponent: () => import('./pages/reclamos/reclamos.component').then(m => m.ReclamosComponent) },
    { path: 'reclamos/filtros', loadComponent: () => import('./pages/reclamos-filtros/reclamos-filtros.component').then(m => m.ReclamosFiltrosComponent) },
    { path: 'reclamos/:id/derivar', loadComponent: () => import('./pages/reclamo-derivar/reclamo-derivar.component').then(m => m.ReclamoDerivarComponent) },
    { path: 'reclamos/:id/seguimiento', loadComponent: () => import('./pages/reclamo-seguimiento/reclamo-seguimiento.component').then(m => m.ReclamoSeguimientoComponent) },
    { path: 'reclamos/:id/comentar', loadComponent: () => import('./pages/reclamo-comentario/reclamo-comentario.component').then(m => m.ReclamoComentarioComponent) },
    { path: 'reclamos/:id/cerrar', loadComponent: () => import('./pages/reclamo-cerrar/reclamo-cerrar.component').then(m => m.ReclamoCerrarComponent) },
    { path: 'reclamos/:id', loadComponent: () => import('./pages/reclamo-detalle/reclamo-detalle.component').then(m => m.ReclamoDetalleComponent) }
  ]}, { path: '**', redirectTo: 'reclamos' }
];
