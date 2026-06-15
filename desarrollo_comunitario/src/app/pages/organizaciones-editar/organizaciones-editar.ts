import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { OrganizacionesService } from '../../services/organizaciones';
import { DirectivaService } from '../../services/directiva';
import { CatalogosService } from '../../services/catalogos';

// Catálogo fijo de cargos: id_cargo = índice + 1 (1=Presidente ... 9=Vocal IV)
const CARGOS = [
  { id: 1, nombre: 'Presidente' },
  { id: 2, nombre: 'Vicepresidente' },
  { id: 3, nombre: 'Secretario' },
  { id: 4, nombre: 'Tesorero' },
  { id: 5, nombre: 'Fiscal' },
  { id: 6, nombre: 'Vocal I' },
  { id: 7, nombre: 'Vocal II' },
  { id: 8, nombre: 'Vocal III' },
  { id: 9, nombre: 'Vocal IV' },
];

@Component({
  selector: 'app-organizaciones-editar',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './organizaciones-editar.html',
  styleUrl: './organizaciones-editar.css'
})
export class OrganizacionesEditar implements OnInit {
  usuario: any;
  sidebarAbierto = signal(false);

  idOrganizacion!: number;
  cargandoOrg = signal(true);
  cargandoDirectiva = signal(true);
  guardando = signal(false);
  error = signal('');
  exito = signal('');

  // Catálogos
  tipos = signal<any[]>([]);
  zonas = signal<any[]>([]);

  // ── Control de acceso / reautenticación ─────────────────────
  desbloqueado = signal(false);
  mostrarModalAuth = signal(false);
  authCorreo = '';
  authPassword = '';
  authError = signal('');
  verificandoAuth = signal(false);

  // ── Datos generales de la organización ──────────────────────
  nombre = '';
  id_tipo: number | null = null;
  id_zona: number | null = null;
  colonia_sector = '';
  fecha_inscripcion = '';
  tomo = '';
  folio = '';
  observaciones = '';

  // ── Directiva actual (editable en sitio) ────────────────────
  directiva = signal<any[]>([]);

  // ── Agregar nuevo miembro ────────────────────────────────────
  mostrarFormNuevo = signal(false);
  nuevoMiembro = {
    id_cargo: null as number | null,
    nombre_completo: '',
    dni: '',
    telefono_personal: '',
    fecha_inicio: ''
  };
  errorNuevo = signal('');
  guardandoNuevo = signal(false);

  constructor(
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute,
    private orgService: OrganizacionesService,
    private directivaService: DirectivaService,
    private catalogosService: CatalogosService
  ) {
    this.usuario = this.auth.getUsuario();
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.idOrganizacion = Number(idParam);

    // Administrador (1) y Jefe de Desarrollo (2) no necesitan autorización
    if (this.usuario?.id_rol === 1 || this.usuario?.id_rol === 2) {
      this.desbloqueado.set(true);
    } else {
      // Técnico (3): el formulario queda bloqueado hasta autorizar
      this.mostrarModalAuth.set(true);
    }

    this.catalogosService.tipos().subscribe({
      next: (res) => this.tipos.set(Array.isArray(res) ? res : [])
    });
    this.catalogosService.zonas().subscribe({
      next: (res) => this.zonas.set(Array.isArray(res) ? res : [])
    });

    this.cargarOrganizacion();
    this.cargarDirectiva();
  }

  cargarOrganizacion() {
    this.cargandoOrg.set(true);
    this.orgService.obtenerPorId(this.idOrganizacion).subscribe({
      next: (org) => {
        this.nombre = org.nombre;
        this.id_tipo = org.id_tipo;
        this.id_zona = org.id_zona;
        this.colonia_sector = org.colonia_sector || '';
        this.fecha_inscripcion = org.fecha_inscripcion?.slice(0, 10) || '';
        this.tomo = org.tomo || '';
        this.folio = org.folio || '';
        this.observaciones = org.observaciones || '';
        this.cargandoOrg.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la organización');
        this.cargandoOrg.set(false);
      }
    });
  }

  cargarDirectiva() {
    this.cargandoDirectiva.set(true);
    this.directivaService.listar(this.idOrganizacion).subscribe({
      next: (miembros) => {
        this.directiva.set((miembros ?? []).map((m: any) => ({
          id: m.id,
          id_cargo: m.id_cargo,
          cargoNombre: m.cargo?.nombre || CARGOS.find(c => c.id === m.id_cargo)?.nombre || '',
          nombre_completo: m.nombre_completo,
          dni: m.dni,
          telefono_personal: m.telefono_personal || '',
          fecha_inicio: m.fecha_inicio?.slice(0, 10) || '',
          _original: {
            nombre_completo: m.nombre_completo,
            dni: m.dni,
            telefono_personal: m.telefono_personal || '',
            fecha_inicio: m.fecha_inicio?.slice(0, 10) || ''
          }
        })));
        this.cargandoDirectiva.set(false);
      },
      error: () => {
        this.directiva.set([]);
        this.cargandoDirectiva.set(false);
      }
    });
  }

  get cargando() {
    return this.cargandoOrg() || this.cargandoDirectiva();
  }

  // Cargos que aún no están en la directiva activa (disponibles para agregar)
  cargosDisponibles() {
    const ocupados = this.directiva().map(m => m.id_cargo);
    return CARGOS.filter(c => !ocupados.includes(c.id));
  }

  totalMiembros() {
    return this.directiva().length;
  }

  // ── Agregar nuevo miembro ────────────────────────────────────
  abrirFormNuevo() {
    this.errorNuevo.set('');
    const disponibles = this.cargosDisponibles();
    this.nuevoMiembro = {
      id_cargo: disponibles[0]?.id ?? null,
      nombre_completo: '',
      dni: '',
      telefono_personal: '',
      fecha_inicio: new Date().toISOString().slice(0, 10)
    };
    this.mostrarFormNuevo.set(true);
  }

  cancelarFormNuevo() {
    this.mostrarFormNuevo.set(false);
    this.errorNuevo.set('');
  }

  guardarNuevoMiembro() {
    this.errorNuevo.set('');

    if (!this.nuevoMiembro.id_cargo || !this.nuevoMiembro.nombre_completo || !this.nuevoMiembro.dni || !this.nuevoMiembro.fecha_inicio) {
      this.errorNuevo.set('Completa cargo, nombre, DNI y fecha de inicio');
      return;
    }

    this.guardandoNuevo.set(true);

    const payload = {
      id_organizacion: this.idOrganizacion,
      id_cargo: this.nuevoMiembro.id_cargo,
      nombre_completo: this.nuevoMiembro.nombre_completo,
      dni: this.nuevoMiembro.dni,
      telefono_personal: this.nuevoMiembro.telefono_personal,
      fecha_inicio: this.nuevoMiembro.fecha_inicio
    };

    this.directivaService.asignarMiembro(payload).subscribe({
      next: () => {
        this.guardandoNuevo.set(false);
        this.mostrarFormNuevo.set(false);
        this.cargarDirectiva();
      },
      error: (err) => {
        this.guardandoNuevo.set(false);
        // Mensaje del trigger (conflicto patronato/junta de agua, límite de presidente, etc.)
        this.errorNuevo.set(err.error?.msg || 'Error al agregar el miembro');
      }
    });
  }

  // ── Quitar miembro existente ─────────────────────────────────
  quitarMiembro(m: any) {
    if (!confirm(`¿Quitar a ${m.nombre_completo} (${m.cargoNombre}) de la directiva?`)) {
      return;
    }

    this.directivaService.desactivarMiembro
      ? this.directivaService.desactivarMiembro(m.id).subscribe({
          next: () => this.cargarDirectiva(),
          error: (err: any) => this.error.set(err.error?.msg || 'Error al quitar el miembro')
        })
      : null;
  }

  // ── Modal de reautenticación (solo Técnico) ─────────────────
  verificarAutorizacion() {
    this.authError.set('');

    if (!this.authCorreo || !this.authPassword) {
      this.authError.set('Ingresa correo y contraseña');
      return;
    }

    this.verificandoAuth.set(true);

    this.auth.verificarCredenciales(this.authCorreo, this.authPassword).subscribe({
      next: (res) => {
        this.verificandoAuth.set(false);
        if (res?.usuario?.id_rol === 2) {
          this.desbloqueado.set(true);
          this.mostrarModalAuth.set(false);
        } else {
          this.authError.set('Estas credenciales no corresponden al Jefe de Desarrollo Comunitario');
        }
      },
      error: () => {
        this.verificandoAuth.set(false);
        this.authError.set('Correo o contraseña incorrectos');
      }
    });
  }

  cancelarAutorizacion() {
    this.router.navigate(['/dashboard']);
  }

  // ── Guardar datos generales + correcciones de directiva ─────
  guardar() {
    this.error.set('');
    this.exito.set('');

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
      observaciones: this.observaciones
    };

    this.orgService.actualizar(this.idOrganizacion, payload).subscribe({
      next: () => {
        this.guardarDirectivaModificada(0);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err.error?.msg || 'Error al actualizar la organización');
      }
    });
  }

  private guardarDirectivaModificada(index: number) {
    const pendientes = this.directiva().filter(m => this.miembroCambio(m));

    if (index >= pendientes.length) {
      this.finalizar('Organización actualizada correctamente.');
      return;
    }

    const m = pendientes[index];
    const payload: any = {
      nombre_completo: m.nombre_completo,
      telefono_personal: m.telefono_personal,
      fecha_inicio: m.fecha_inicio
    };
    if (m.dni !== m._original.dni) {
      payload.dni = m.dni;
    }

    this.directivaService.actualizarMiembro(m.id, payload).subscribe({
      next: () => this.guardarDirectivaModificada(index + 1),
      error: (err) => {
        this.guardando.set(false);
        this.error.set(
          `Los datos generales se guardaron, pero hubo un problema corrigiendo a "${m.nombre_completo}" (${m.cargoNombre}): ${err.error?.msg || 'Error desconocido'}.`
        );
      }
    });
  }

  private miembroCambio(m: any): boolean {
    return m.nombre_completo !== m._original.nombre_completo
      || m.dni !== m._original.dni
      || m.telefono_personal !== m._original.telefono_personal
      || m.fecha_inicio !== m._original.fecha_inicio;
  }

  private finalizar(mensaje: string) {
    this.guardando.set(false);
    this.exito.set(mensaje);
    setTimeout(() => this.router.navigate(['/dashboard']), 1200);
  }

  esAdmin()    { return this.usuario?.id_rol === 1; }
  esJefe()     { return this.usuario?.id_rol === 2; }
  esTecnico()  { return this.usuario?.id_rol === 3; }

  nombreRol(): string {
    switch (this.usuario?.id_rol) {
      case 1: return 'Administrador';
      case 2: return 'Jefe de Desarrollo Comunitario';
      case 3: return 'Técnico';
      case 4: return 'Consulta';
      default: return 'Sin rol';
    }
  }

  iniciales(): string {
    return (this.usuario?.correo || '??').substring(0, 2).toUpperCase();
  }

  cerrarSesion() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}