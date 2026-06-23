import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Registro } from './pages/registro/registro';
import { Renovaciones } from './pages/renovaciones/renovaciones';
import { RenovacionesDetalle } from './pages/renovaciones-detalle/renovaciones-detalle';
import { OrganizacionesEditar } from './pages/organizaciones-editar/organizaciones-editar';
import { Alertas } from './pages/alertas/alertas';
import { OrganizacionesLista } from './pages/organizaciones-lista/organizaciones-lista';
import { HistorialDirectivas } from './pages/historial-directivas/historial-directivas';
import { Autorizaciones } from './pages/autorizaciones/autorizaciones';
import { authGuard } from './guards/auth-guard';
// Importar los nuevos componentes
import { UsuariosComponent } from './pages/usuarios/usuarios.component'; // 👈 Importar
import { UsuarioFormComponent } from './pages/usuario-form/usuario-form.component'; // 👈 Importar (si lo tienes)

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'registro', component: Registro, canActivate: [authGuard] },
  { path: 'renovaciones', component: Renovaciones, canActivate: [authGuard] },
  { path: 'renovaciones/:id', component: RenovacionesDetalle, canActivate: [authGuard] },
  { path: 'organizaciones-editar/:id', component: OrganizacionesEditar, canActivate: [authGuard] },
  { path: 'alertas', component: Alertas, canActivate: [authGuard] },
  { path: 'organizaciones-lista', component: OrganizacionesLista, canActivate: [authGuard] },
  { path: 'historial-directivas', component: HistorialDirectivas, canActivate: [authGuard] },
  { path: 'autorizaciones', component: Autorizaciones, canActivate: [authGuard] },
  // Nuevas rutas de usuarios
  { path: 'usuarios', component: UsuariosComponent, canActivate: [authGuard] },
  { path: 'usuarios/nuevo', component: UsuarioFormComponent, canActivate: [authGuard] },
  { path: 'usuarios/editar/:id', component: UsuarioFormComponent, canActivate: [authGuard] },
  {path: 'configuracion', loadComponent: () => import('./pages/configuracion/configuracion.component').then(m => m.ConfiguracionComponent)}
];