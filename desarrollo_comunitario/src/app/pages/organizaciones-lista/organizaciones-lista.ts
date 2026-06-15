import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';
import { OrganizacionesService } from '../../services/organizaciones';
import { CatalogosService } from '../../services/catalogos';

@Component({
  selector: 'app-organizaciones-lista',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './organizaciones-lista.html',
  styleUrl: './organizaciones-lista.css'
})


export class OrganizacionesLista implements OnInit {
  usuario: any;
  sidebarAbierto = signal(false);

  organizaciones = signal<any[]>([]);
  cargando = signal(true);

  // Catálogos para filtros
  tipos = signal<any[]>([]);
  zonas = signal<any[]>([]);

  // Filtros
  filtroTipo = signal<number | null>(null);
  filtroZona = signal<number | null>(null);
  filtroCategoria = signal('todos');
  busqueda = signal('');

  private timeoutBusqueda: any;

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
      next: (res) => this.tipos.set(Array.isArray(res) ? res : [])
    });
    this.catalogosService.zonas().subscribe({
      next: (res) => this.zonas.set(Array.isArray(res) ? res : [])
    });

    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.orgService.obtenerReporte({
      tipo: this.filtroTipo(),
      zona: this.filtroZona(),
      categoria: this.filtroCategoria(),
      busqueda: this.busqueda()
    }).subscribe({
      next: (res) => {
        this.organizaciones.set(res ?? []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando reporte de organizaciones:', err);
        this.cargando.set(false);
      }
    });
  }

  setCategoria(cat: string) {
    this.filtroCategoria.set(cat);
    this.cargar();
  }

  onTipoChange(valor: string) {
    this.filtroTipo.set(valor ? Number(valor) : null);
    this.cargar();
  }

  onZonaChange(valor: string) {
    this.filtroZona.set(valor ? Number(valor) : null);
    this.cargar();
  }

  onBusquedaChange(valor: string) {
    this.busqueda.set(valor);
    clearTimeout(this.timeoutBusqueda);
    this.timeoutBusqueda = setTimeout(() => this.cargar(), 400);
  }

  presidente(o: any): any {
    return o.directiva?.[0] ?? null;
  }

  textoEstado(o: any): string {
    switch (o.estado) {
      case 'activa': return 'Vigente';
      case 'proxima_vencer': return 'Por vencer';
      case 'vencida': return 'Vencida';
      default: return o.estado;
    }
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