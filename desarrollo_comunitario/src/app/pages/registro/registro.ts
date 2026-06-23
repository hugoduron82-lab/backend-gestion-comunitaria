import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { OrganizacionesService } from '../../services/organizaciones';
import { CatalogosService } from '../../services/catalogos';
import { DirectivaService } from '../../services/directiva';
import { BadgeAlertasService } from '../../services/badge-alertas';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro implements OnInit {
  usuario: any;
  sidebarAbierto = signal(false);
  tipos = signal<any[]>([]);
  zonas = signal<any[]>([]);
  guardando = signal(false);
  error = signal('');
  directivaAmpliada = signal(false);
  nombre = '';
  id_tipo: number | null = null;
  id_zona: number | null = null;
  colonia_sector = '';
  fecha_inscripcion = '';
  tomo = '';
  folio = '';
  observaciones = '';

  miembros = [
    { cargo: 'Presidente',     nombre: '', dni: '', telefono: '' },
    { cargo: 'Vicepresidente', nombre: '', dni: '', telefono: '' },
    { cargo: 'Secretario',     nombre: '', dni: '', telefono: '' },
    { cargo: 'Tesorero',       nombre: '', dni: '', telefono: '' },
    { cargo: 'Fiscal',         nombre: '', dni: '', telefono: '' },
    { cargo: 'Vocal I',        nombre: '', dni: '', telefono: '' },
    { cargo: 'Vocal II',       nombre: '', dni: '', telefono: '' },
    { cargo: 'Vocal III',      nombre: '', dni: '', telefono: '' },
    { cargo: 'Vocal IV',       nombre: '', dni: '', telefono: '' },
  ];

  constructor(
    private auth: Auth,
    private router: Router,
    private orgService: OrganizacionesService,
    private catalogosService: CatalogosService,
    private directivaService: DirectivaService,
    public badgeAlertas: BadgeAlertasService
  ) {
    this.usuario = this.auth.getUsuario();
  }

  ngOnInit() {
    // Rol consulta no puede acceder a esta página
    if (this.usuario?.id_rol === 4) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.badgeAlertas.cargar();
    this.catalogosService.tipos().subscribe({
      next: (res) => this.tipos.set(Array.isArray(res) ? res : []),
      error: (err) => console.error('Error cargando tipos:', err)
    });
    this.catalogosService.zonas().subscribe({
      next: (res) => this.zonas.set(Array.isArray(res) ? res : []),
      error: (err) => console.error('Error cargando zonas:', err)
    });
  }

  onSubmit() {
    this.error.set('');
    if (!this.nombre || !this.id_tipo || !this.id_zona || !this.fecha_inscripcion) {
      this.error.set('Completa los campos obligatorios marcados con *');
      return;
    }
    const totalMiembros = this.directivaAmpliada() ? 9 : 7;
    const miembrosActivos = this.miembros.slice(0, totalMiembros);
    const incompleto = miembrosActivos.find(m => !m.nombre || !m.dni);
    if (incompleto) {
      this.error.set(`Completa nombre y DNI de todos los miembros (${incompleto.cargo})`);
      return;
    }
    this.guardando.set(true);
    const payload = {
      nombre: this.nombre, id_tipo: this.id_tipo, id_zona: this.id_zona,
      colonia_sector: this.colonia_sector, tomo: this.tomo, folio: this.folio,
      fecha_inscripcion: this.fecha_inscripcion,
      total_directiva: totalMiembros, observaciones: this.observaciones
    };
    this.orgService.crear(payload).subscribe({
      next: (org) => this.guardarDirectiva(org.id, miembrosActivos, 0),
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err.error?.msg || 'Error al guardar la organización');
      }
    });
  }

  private guardarDirectiva(idOrganizacion: number, miembros: any[], index: number) {
    if (index >= miembros.length) {
      this.guardando.set(false);
      this.router.navigate(['/dashboard']);
      return;
    }
    const m = miembros[index];
    const payload = {
      id_organizacion: idOrganizacion, id_cargo: index + 1,
      nombre_completo: m.nombre, dni: m.dni,
      telefono_personal: m.telefono, fecha_inicio: this.fecha_inscripcion
    };
    this.directivaService.asignarMiembro(payload).subscribe({
      next: () => this.guardarDirectiva(idOrganizacion, miembros, index + 1),
      error: (err) => {
        this.guardando.set(false);
        this.error.set(
          `La organización se creó, pero hubo un problema con "${m.cargo}": ${err.error?.msg || 'Error al guardar este miembro'}.`
        );
      }
    });
  }

  esAdmin()    { return this.usuario?.id_rol === 1; }
  esConsulta() { return this.usuario?.id_rol === 4; }
  esJefe()     { return this.usuario?.id_rol === 2; }
  esTecnico()  { return this.usuario?.id_rol === 3; }

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

  cerrarSesion() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
