import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfiguracionService, Configuracion } from '../../services/configuracion.service';
import { Auth } from '../../services/auth';
import { BadgeAlertasService } from '../../services/badge-alertas';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent implements OnInit {
  usuario: any;
  sidebarAbierto = signal(false);
  fechaHoy = '';
  Math = Math;

  configs: Configuracion[] = [];
  loading = false;
  error = '';
  mensajeExito = '';

  mostrarFormulario = false;
  esEdicion = false;
  configForm: Partial<Configuracion> = {
    id: 0,
    clave: '',
    valor: '',
    descripcion: ''
  };

  constructor(
    private configService: ConfiguracionService,
    private auth: Auth,
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
    this.cargarConfiguraciones();
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

  // ========== CONFIGURACIONES ==========
  cargarConfiguraciones(): void {
    this.loading = true;
    this.error = '';
    this.configService.listar().subscribe({
      next: (data) => {
        this.configs = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar configuraciones';
        this.loading = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  // ========== FORMATEAR CLAVE ==========
  formatearClave(clave: string): string {
    if (!clave) return '';
    let resultado = clave.replace(/_/g, ' ');
    return resultado.replace(/\b\w/g, letra => letra.toUpperCase());
  }

  // ========== FORMULARIO ==========
  abrirFormularioNuevo(): void {
    this.mostrarFormulario = true;
    this.esEdicion = false;
    this.configForm = { clave: '', valor: '', descripcion: '' };
    this.error = '';
    this.mensajeExito = '';
  }

  abrirFormularioEditar(config: Configuracion): void {
    this.mostrarFormulario = true;
    this.esEdicion = true;
    this.configForm = { ...config };
    this.error = '';
    this.mensajeExito = '';
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.configForm = { clave: '', valor: '', descripcion: '' };
    this.error = '';
    this.mensajeExito = '';
  }

  guardarConfiguracion(): void {
    if (!this.configForm.clave || !this.configForm.valor) {
      this.error = 'Clave y valor son obligatorios';
      return;
    }

    this.loading = true;
    this.error = '';
    this.mensajeExito = '';

    if (this.esEdicion && this.configForm.id) {
      // Actualizar
      this.configService.actualizar(this.configForm.id, {
        valor: this.configForm.valor,
        descripcion: this.configForm.descripcion
      }).subscribe({
        next: () => {
          this.mensajeExito = 'Configuración actualizada correctamente';
          this.loading = false;
          this.cerrarFormulario();
          this.cargarConfiguraciones();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Error al actualizar configuración';
          this.loading = false;
          this.cdr.detectChanges();
          console.error(err);
        }
      });
    } else {
      // Crear
      this.configService.crear({
        clave: this.configForm.clave,
        valor: this.configForm.valor,
        descripcion: this.configForm.descripcion
      }).subscribe({
        next: () => {
          this.mensajeExito = 'Configuración creada correctamente';
          this.loading = false;
          this.cerrarFormulario();
          this.cargarConfiguraciones();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Error al crear configuración. ¿Ya existe esa clave?';
          this.loading = false;
          this.cdr.detectChanges();
          console.error(err);
        }
      });
    }
  }

  eliminarConfiguracion(id: number, clave: string): void {
    if (!confirm(`¿Estás seguro de eliminar la configuración "${this.formatearClave(clave)}"?`)) return;

    this.loading = true;
    this.configService.eliminar(id).subscribe({
      next: () => {
        this.mensajeExito = `Configuración "${this.formatearClave(clave)}" eliminada`;
        this.loading = false;
        this.cdr.detectChanges();
        // Recargar después de eliminar
        this.cargarConfiguraciones();
      },
      error: (err) => {
        this.error = 'Error al eliminar configuración';
        this.loading = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }
}