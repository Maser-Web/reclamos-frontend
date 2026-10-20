import { Routes } from '@angular/router';
import { MobileLayoutComponent } from './core/components/mobile-layout.component';
import { authGuard } from './core/Guards/auth.guard';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: '', component: MobileLayoutComponent, canActivateChild: [authGuard], children: [
    { path: 'reclamos', loadComponent: () => import('./pages/reclamos/reclamos.component').then(m => m.ReclamosComponent) },
    { path: 'reclamos/filtros', loadComponent: () => import('./pages/reclamos-filtros/reclamos-filtros.component').then(m => m.ReclamosFiltrosComponent) },
    { path: 'reclamos/:id/derivar', loadComponent: () => import('./pages/reclamo-derivar/reclamo-derivar.component').then(m => m.ReclamoDerivarComponent) },
    { path: 'reclamos/:id/seguimiento', loadComponent: () => import('./pages/reclamo-seguimiento/reclamo-seguimiento.component').then(m => m.ReclamoSeguimientoComponent) },
    { path: 'reclamos/:id/comentar', loadComponent: () => import('./pages/reclamo-comentario/reclamo-comentario.component').then(m => m.ReclamoComentarioComponent) },
    { path: 'reclamos/:id/cerrar', loadComponent: () => import('./pages/reclamo-cerrar/reclamo-cerrar.component').then(m => m.ReclamoCerrarComponent) },
    { path: 'reclamos/:id', loadComponent: () => import('./pages/reclamo-detalle/reclamo-detalle.component').then(m => m.ReclamoDetalleComponent) },
    { path: 'mis-tareas', loadComponent: () => import('./pages/mis-tareas/mis-tareas.component').then(m => m.MisTareasComponent) },
    { path: 'menu', loadComponent: () => import('./pages/reclamos-menu/reclamos-menu.component').then(m => m.ReclamosMenuComponent) },
    { path: 'reportes', loadComponent: () => import('./pages/informativa/informativa.component').then(m => m.InformativaComponent) },
    { path: 'configuracion', loadComponent: () => import('./pages/informativa/informativa.component').then(m => m.InformativaComponent) }
  ]}, { path: '**', redirectTo: 'reclamos' }
];
