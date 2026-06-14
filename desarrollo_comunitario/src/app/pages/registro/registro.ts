// pages/registro/registro.ts
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { OrganizacionesService } from '../../services/organizaciones';
import { CatalogosService } from '../../services/catalogos';

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

  // Catálogos
  tipos = signal<any[]>([]);
  zonas = signal<any[]>([]);

  // Estado del formulario
  guardando = signal(false);
  error = signal('');

  // Directiva: 7 (normal) o 9 (ampliada) miembros
  directivaAmpliada = signal(false);

  // Campos de la organización
  nombre = '';
  id_tipo: number | null = null;
  id_zona: number | null = null;
  colonia_sector = '';
  fecha_inscripcion = '';
  tomo = '';
  folio = '';
  observaciones = '';

  // Miembros de la directiva (9 cargos posibles; los últimos 2 solo se usan si directivaAmpliada = true)
  miembros = [
    { cargo: 'Presidente', nombre: '', dni: '', telefono: '' },
    { cargo: 'Vicepresidente', nombre: '', dni: '', telefono: '' },
    { cargo: 'Secretario', nombre: '', dni: '', telefono: '' },
    { cargo: 'Tesorero', nombre: '', dni: '', telefono: '' },
    { cargo: 'Fiscal', nombre: '', dni: '', telefono: '' },
    { cargo: 'Vocal I', nombre: '', dni: '', telefono: '' },
    { cargo: 'Vocal II', nombre: '', dni: '', telefono: '' },
    { cargo: 'Vocal III', nombre: '', dni: '', telefono: '' },
    { cargo: 'Vocal IV', nombre: '', dni: '', telefono: '' },
  ];

  constructor(
    private auth: Auth,
    private router: Router,
    private orgService: OrganizacionesService,
    private catalogosService: CatalogosService
  ) {
    this.usuario = this.auth.getUsuario();
  }

  ngOnInit() {
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

    this.guardando.set(true);

    const payload = {
      nombre: this.nombre,
      id_tipo: this.id_tipo,
      id_zona: this.id_zona,
      colonia_sector: this.colonia_sector,
      tomo: this.tomo,
      folio: this.folio,
      fecha_inscripcion: this.fecha_inscripcion,
      total_directiva: this.directivaAmpliada() ? 9 : 7,
      observaciones: this.observaciones
    };

    this.orgService.crear(payload).subscribe({
      next: (res) => {
        // Organización creada (res.id). Los miembros de la directiva
        // se conectarán cuando tengamos el endpoint de directiva.
        this.guardando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err.error?.msg || 'Error al guardar la organización');
      }
    });
  }

  esAdmin()    { return this.usuario?.id_rol === 1; }
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