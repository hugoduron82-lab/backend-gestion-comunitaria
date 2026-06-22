import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsuariosService, Usuario } from '../../services/usuarios.service';
import { Auth } from '../../services/auth';
import { BadgeAlertasService } from '../../services/badge-alertas';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.css']
})
export class UsuarioFormComponent implements OnInit {
  // ========== SIDEBAR ==========
  usuario: any;
  sidebarAbierto = signal(false);  // 👈 ¡OBLIGATORIO!
  fechaHoy = '';
  Math = Math;

  // ========== FORMULARIO ==========
  esEdicion = false;
  usuarioId?: number;
  usuarioForm: any = {
    id_empleado: 0,
    correo: '',
    id_rol: 0,
    activo: true,
    password: ''
  };
  roles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Jefe Desarrollo' },
    { id: 3, nombre: 'Técnico' },
    { id: 4, nombre: 'Consulta' }
  ];
  loading = false;
  error = '';
  mensajeExito = '';

  constructor(
    private usuariosService: UsuariosService,
    private auth: Auth,
    private route: ActivatedRoute,
    private router: Router,
    public badgeAlertas: BadgeAlertasService,
    private cdr: ChangeDetectorRef
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

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.usuarioId = +id;
      this.cargarUsuario(this.usuarioId);
    }
  }

  // ========== SIDEBAR ==========
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

  // ========== FORMULARIO ==========
  cargarUsuario(id: number): void {
    this.loading = true;
    this.usuariosService.obtener(id).subscribe({
      next: (data) => {
        this.usuarioForm = {
          id: data.id,
          id_empleado: data.id_empleado,
          correo: data.correo,
          id_rol: data.id_rol,
          activo: data.activo,
          password: ''
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar usuario';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  guardar(): void {
    if (!this.usuarioForm.correo || !this.usuarioForm.id_rol) {
      this.error = 'Correo y Rol son obligatorios';
      return;
    }
    if (!this.esEdicion && !this.usuarioForm.password) {
      this.error = 'La contraseña es obligatoria para nuevo usuario';
      return;
    }

    this.loading = true;
    this.error = '';
    this.mensajeExito = '';

    if (this.esEdicion) {
      const data: any = {
        correo: this.usuarioForm.correo,
        id_rol: this.usuarioForm.id_rol,
        activo: this.usuarioForm.activo
      };
      if (this.usuarioForm.password) {
        data.password = this.usuarioForm.password;
      }
      this.usuariosService.actualizar(this.usuarioId!, data).subscribe({
        next: () => {
          this.mensajeExito = 'Usuario actualizado correctamente';
          this.loading = false;
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/usuarios']), 1500);
        },
        error: () => {
          this.error = 'Error al actualizar usuario';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.usuariosService.crear({
        id_empleado: this.usuarioForm.id_empleado,
        correo: this.usuarioForm.correo,
        password: this.usuarioForm.password,
        id_rol: this.usuarioForm.id_rol,
        activo: this.usuarioForm.activo
      }).subscribe({
        next: () => {
          this.mensajeExito = 'Usuario creado correctamente';
          this.loading = false;
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/usuarios']), 1500);
        },
        error: () => {
          this.error = 'Error al crear usuario';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/usuarios']);
  }
}