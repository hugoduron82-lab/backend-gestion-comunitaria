import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { AutorizacionesService } from '../../services/autorizaciones';
import { OrganizacionesService } from '../../services/organizaciones';
import { DirectivaService } from '../../services/directiva';
import { BadgeAlertasService } from '../../services/badge-alertas';

@Component({
  selector: 'app-autorizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './autorizaciones.html',
  styleUrl: './autorizaciones.css'
})
export class Autorizaciones implements OnInit {
  usuario: any;
  sidebarAbierto = signal(false);
  autorizaciones = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  exito = signal('');
  mostrarFormulario = signal(false);
  buscandoDni = signal(false);
  dniBuscado = signal('');
  mensajeDni = signal('');
  nuevo = {
    dni: '', nombre_persona: '', id_organizacion: null as number | null,
    periodo_solicitado: 3, justificacion: ''
  };
  organizaciones = signal<any[]>([]);

  constructor(
    private auth: Auth,
    private router: Router,
    private autorizacionesService: AutorizacionesService,
    private orgService: OrganizacionesService,
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
    this.cargar();
    this.cargarOrganizaciones();
  }

  cargar() {
    this.cargando.set(true);
    this.autorizacionesService.listar().subscribe({
      next: (res) => { this.autorizaciones.set(res ?? []); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  cargarOrganizaciones() {
    this.orgService.listar({ porPagina: 100 }).subscribe({
      next: (res) => this.organizaciones.set(res.data ?? [])
    });
  }

  abrirFormulario() {
    this.nuevo = { dni: '', nombre_persona: '', id_organizacion: null, periodo_solicitado: 3, justificacion: '' };
    this.error.set(''); this.exito.set(''); this.mensajeDni.set(''); this.dniBuscado.set('');
    this.mostrarFormulario.set(true);
  }

  cancelar() { this.mostrarFormulario.set(false); this.error.set(''); this.mensajeDni.set(''); }

  onDniChange(valor: string) {
    this.nuevo.dni = valor;
    this.mensajeDni.set('');
    const dniLimpio = valor.replace(/-/g, '');
    if (dniLimpio.length < 13) return;
    if (this.dniBuscado() === valor) return;
    this.buscandoDni.set(true);
    this.dniBuscado.set(valor);
    this.directivaService.buscarPorDni(valor).subscribe({
      next: (res) => {
        this.buscandoDni.set(false);
        this.nuevo.nombre_persona = res.nombre_completo;
        this.nuevo.id_organizacion = res.id_organizacion;
        this.mensajeDni.set(`✅ Encontrado: ${res.cargo} del ${res.nombre_organizacion}`);
      },
      error: (err) => {
        this.buscandoDni.set(false);
        if (err.status === 404) {
          this.nuevo.nombre_persona = ''; this.nuevo.id_organizacion = null;
          this.mensajeDni.set('⚠️ No se encontró un presidente activo con ese DNI. Puedes ingresar los datos manualmente.');
        }
      }
    });
  }

  guardar() {
    this.error.set('');
    if (!this.nuevo.dni || !this.nuevo.nombre_persona || !this.nuevo.id_organizacion || !this.nuevo.justificacion) {
      this.error.set('Completa todos los campos obligatorios'); return;
    }
    this.guardando.set(true);
    this.autorizacionesService.crear(this.nuevo).subscribe({
      next: () => {
        this.guardando.set(false); this.mostrarFormulario.set(false);
        this.exito.set('Autorización creada correctamente.');
        this.cargar();
        setTimeout(() => this.exito.set(''), 3000);
      },
      error: (err) => { this.guardando.set(false); this.error.set(err.error?.msg || 'Error al crear la autorización'); }
    });
  }

  activas()    { return this.autorizaciones().filter(a =>  a.activa); }
  historicas() { return this.autorizaciones().filter(a => !a.activa); }

  esAdmin()    { return this.usuario?.id_rol === 1; }
  esJefe()     { return this.usuario?.id_rol === 2; }
  esTecnico()  { return this.usuario?.id_rol === 3; }
  esConsulta() { return this.usuario?.id_rol === 4; }

  nombreRol(): string {
    switch (this.usuario?.id_rol) {
      case 1: return 'Administrador'; case 2: return 'Jefe de Desarrollo Comunitario';
      case 3: return 'Técnico'; case 4: return 'Consulta'; default: return 'Sin rol';
    }
  }

  iniciales(): string { return (this.usuario?.correo || '??').substring(0, 2).toUpperCase(); }
  cerrarSesion() { this.auth.logout(); this.router.navigate(['/login']); }
}