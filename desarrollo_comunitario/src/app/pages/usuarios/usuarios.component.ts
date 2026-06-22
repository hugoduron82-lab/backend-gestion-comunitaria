import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuariosService, Usuario, UsuariosResponse } from '../../services/usuarios.service';
import { Auth } from '../../services/auth';
import { BadgeAlertasService } from '../../services/badge-alertas';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  // Sidebar
  usuario: any;
  sidebarAbierto = signal(false);
  Math = Math;

  // Datos de usuarios
  usuarios: Usuario[] = [];
  loading = false;
  error = '';
  filtroActivo: string = ''; // '' = todos, 'true' = activos, 'false' = inactivos
  paginaActual = 1;
  limite = 20; // Cambiado a 20
  totalUsuarios = 0;
  totalPaginas = 0;
  fechaHoy = '';

  constructor(
    private usuariosService: UsuariosService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef, // para forzar detección de cambios
    public badgeAlertas: BadgeAlertasService
  ) {
    this.usuario = this.auth.getUsuario();
  }

  ngOnInit(): void {
    this.fechaHoy = new Date().toLocaleDateString('es-HN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    this.cargarUsuarios(); // Carga inicial
  }

  // Métodos del sidebar
  iniciales(): string {
    return (this.usuario?.correo || '??').substring(0, 2).toUpperCase();
  }

  nombreRol(): string {
    switch (this.usuario?.id_rol) {
      case 1: return 'Administrador';
      case 2: return 'Jefe de Desarrollo Comunitario';
      case 3: return 'Técnico';
      case 4: return 'Consulta';
      default: return 'Sin rol';
    }
  }

  esAdmin(): boolean {
    return this.usuario?.id_rol === 1;
  }

  esJefe(): boolean {
    return this.usuario?.id_rol === 2;
  }

  esTecnico(): boolean {
    return this.usuario?.id_rol === 3;
  }

  esConsulta(): boolean {
    return this.usuario?.id_rol === 4;
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // Métodos de usuarios
  cargarUsuarios(): void {
    this.loading = true;
    this.error = '';
    const filtros: any = {
      pagina: this.paginaActual,
      limite: this.limite
    };
    if (this.filtroActivo !== '') {
      filtros.activo = this.filtroActivo === 'true';
    }

    this.usuariosService.listar(filtros).subscribe({
      next: (resp: UsuariosResponse) => {
        this.usuarios = resp.usuarios;
        this.totalUsuarios = resp.total;
        this.totalPaginas = resp.totalPaginas;
        this.loading = false;
        this.cdr.detectChanges(); // Forzar actualización de la vista
      },
      error: (err) => {
        this.error = 'Error al cargar usuarios.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  // Aplicar filtros (se llama al hacer clic en el botón)
  aplicarFiltros(): void {
    this.paginaActual = 1; // Reiniciar a la primera página al filtrar
    this.cargarUsuarios();
  }

  // Cambiar de página
  irPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarUsuarios();
  }

  // Editar
  editarUsuario(id: number): void {
    this.router.navigate(['/usuarios/editar', id]);
  }

  // Crear
  crearUsuario(): void {
    this.router.navigate(['/usuarios/nuevo']);
  }

  // Activar/Desactivar
  toggleEstado(usuario: Usuario): void {
    const mensaje = usuario.activo
      ? `¿Desactivar al usuario ${usuario.correo}?`
      : `¿Reactivar al usuario ${usuario.correo}?`;
    if (!confirm(mensaje)) return;

    const obs = usuario.activo
      ? this.usuariosService.desactivar(usuario.id)
      : this.usuariosService.reactivar(usuario.id);

    obs.subscribe({
      next: () => {
        usuario.activo = !usuario.activo;
        // No recargamos toda la tabla, solo actualizamos el estado local
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error al cambiar estado del usuario');
      }
    });
  }
}