import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { OrganizacionesService } from '../../services/organizaciones';
import { DirectivaService } from '../../services/directiva';
import { CatalogosService } from '../../services/catalogos';
import { BadgeAlertasService } from '../../services/badge-alertas';

@Component({
  selector: 'app-renovaciones-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './renovaciones-detalle.html',
  styleUrl: './renovaciones-detalle.css'
})
export class RenovacionesDetalle implements OnInit {
  usuario: any;
  sidebarAbierto = signal(false);
  idOrganizacion!: number;
  organizacion = signal<any>(null);
  directivaActual = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  exito = signal('');
  tipos = signal<any[]>([]);
  zonas = signal<any[]>([]);
  fecha_vencimiento_nueva = '';
  tomo_nuevo = '';
  folio_nuevo = '';
  observaciones_renovacion = '';
  renovarDirectivaFlag = signal(false);
  motivoCambioDirectiva = '';
  directivaAmpliada = signal(false);

  miembrosNuevos = [
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

  fecha_inicio_directiva = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute,
    private orgService: OrganizacionesService,
    private directivaService: DirectivaService,
    private catalogosService: CatalogosService,
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
    const idParam = this.route.snapshot.paramMap.get('id');
    this.idOrganizacion = Number(idParam);
    this.badgeAlertas.cargar();

    this.catalogosService.tipos().subscribe({
      next: (res) => this.tipos.set(Array.isArray(res) ? res : [])
    });
    this.catalogosService.zonas().subscribe({
      next: (res) => this.zonas.set(Array.isArray(res) ? res : [])
    });

    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);
    this.orgService.obtenerPorId(this.idOrganizacion).subscribe({
      next: (org) => {
        this.organizacion.set(org);
        this.sugerirFechaVencimiento(org);
      },
      error: () => {
        this.error.set('No se pudo cargar la organización');
        this.cargando.set(false);
      }
    });
    this.directivaService.listar(this.idOrganizacion).subscribe({
      next: (miembros) => {
        this.directivaActual.set(miembros ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.directivaActual.set([]);
        this.cargando.set(false);
      }
    });
  }

  private sugerirFechaVencimiento(org: any) {
    const tipo = this.tipos().find(t => t.id === org.id_tipo);
    const vigenciaMeses = tipo?.vigencia_meses ?? 12;
    const hoy = new Date();
    const nueva = new Date(hoy);
    nueva.setMonth(hoy.getMonth() + vigenciaMeses);
    this.fecha_vencimiento_nueva = nueva.toISOString().slice(0, 10);
    this.fecha_inicio_directiva = hoy.toISOString().slice(0, 10);
  }

  diasVencida(): number {
    const org = this.organizacion();
    if (!org) return 0;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(org.fecha_vencimiento);
    return Math.round((hoy.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
  }

  copiarDirectivaActual() {
    const actuales = this.directivaActual();
    this.miembrosNuevos.forEach((m, i) => {
      const existente = actuales.find((a: any) => a.id_cargo === i + 1);
      if (existente) {
        m.nombre   = existente.nombre_completo;
        m.dni      = existente.dni;
        m.telefono = existente.telefono_personal || '';
      }
    });
    if (actuales.length > 7) this.directivaAmpliada.set(true);
  }

  onToggleRenovarDirectiva(valor: boolean) {
    this.renovarDirectivaFlag.set(valor);
    if (valor && this.miembrosNuevos.every(m => !m.nombre)) {
      this.copiarDirectivaActual();
    }
  }

  guardar() {
    this.error.set('');
    this.exito.set('');

    if (!this.fecha_vencimiento_nueva) {
      this.error.set('La nueva fecha de vencimiento es obligatoria');
      return;
    }

    if (this.renovarDirectivaFlag()) {
      const totalMiembros = this.directivaAmpliada() ? 9 : 7;
      const incompleto = this.miembrosNuevos.slice(0, totalMiembros).find(m => !m.nombre || !m.dni);
      if (incompleto) {
        this.error.set(`Completa nombre y DNI de todos los miembros (${incompleto.cargo})`);
        return;
      }
      if (!this.fecha_inicio_directiva) {
        this.error.set('La fecha de inicio de la nueva directiva es obligatoria');
        return;
      }
    }

    this.guardando.set(true);

    const payloadRenovacion: any = {
      fecha_vencimiento_nueva: this.fecha_vencimiento_nueva,
      observaciones: this.observaciones_renovacion
    };
    if (this.tomo_nuevo)  payloadRenovacion.tomo_nuevo  = this.tomo_nuevo;
    if (this.folio_nuevo) payloadRenovacion.folio_nuevo = this.folio_nuevo;

    this.orgService.renovar(this.idOrganizacion, payloadRenovacion).subscribe({
      next: () => {
        if (this.renovarDirectivaFlag()) {
          this.guardarNuevaDirectiva();
        } else {
          // Actualizar badge tras renovar (una organización deja de ser vencida)
          this.badgeAlertas.recargar();
          this.finalizar('Vigencia renovada correctamente.');
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err.error?.msg || 'Error al renovar la vigencia');
      }
    });
  }

  private guardarNuevaDirectiva() {
    const totalMiembros = this.directivaAmpliada() ? 9 : 7;
    const miembros = this.miembrosNuevos.slice(0, totalMiembros).map((m, i) => ({
      id_cargo: i + 1,
      nombre_completo: m.nombre,
      dni: m.dni,
      telefono_personal: m.telefono,
      fecha_inicio: this.fecha_inicio_directiva
    }));

    this.directivaService.renovar(
      this.idOrganizacion, miembros,
      this.motivoCambioDirectiva || 'Renovación periódica'
    ).subscribe({
      next: () => {
        this.badgeAlertas.recargar();
        this.finalizar('Vigencia y directiva renovadas correctamente.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(
          `La vigencia se renovó correctamente, pero hubo un problema con la directiva: ${err.error?.msg || 'Error desconocido'}.`
        );
      }
    });
  }

  private finalizar(mensaje: string) {
    this.guardando.set(false);
    this.exito.set(mensaje);
    setTimeout(() => this.router.navigate(['/renovaciones']), 1200);
  }

  esAdmin()    { return this.usuario?.id_rol === 1; }
  esConsulta() { return this.usuario?.id_rol === 4; }
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
