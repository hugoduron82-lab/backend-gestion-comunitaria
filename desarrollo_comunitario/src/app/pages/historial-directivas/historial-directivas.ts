import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { HistorialService } from '../../services/historial';
import { CatalogosService } from '../../services/catalogos';

@Component({
  selector: 'app-historial-directivas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './historial-directivas.html',
  styleUrl: './historial-directivas.css'
})
export class HistorialDirectivas implements OnInit {
  usuario: any;
  sidebarAbierto = signal(false);

  eventos = signal<any[]>([]);
  cargando = signal(true);

  zonas = signal<any[]>([]);
  filtroZona = signal<number | null>(null);
  busqueda = signal('');

  paginaActual = signal(1);
  totalPaginas = signal(1);
  totalRegistros = signal(0);

  private timeoutBusqueda: any;

  constructor(
    private auth: Auth,
    private router: Router,
    private historialService: HistorialService,
    private catalogosService: CatalogosService
  ) {
    this.usuario = this.auth.getUsuario();
  }

  ngOnInit() {
    this.catalogosService.zonas().subscribe({
      next: (res) => this.zonas.set(Array.isArray(res) ? res : [])
    });
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.historialService.listar({
      busqueda: this.busqueda(),
      zona: this.filtroZona(),
      pagina: this.paginaActual(),
      porPagina: 15
    }).subscribe({
      next: (res) => {
        this.eventos.set(res.data ?? []);
        this.totalPaginas.set(res.totalPaginas ?? 1);
        this.totalRegistros.set(res.total ?? 0);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando historial de directivas:', err);
        this.cargando.set(false);
      }
    });
  }

  onBusquedaChange(valor: string) {
    this.busqueda.set(valor);
    this.paginaActual.set(1);
    clearTimeout(this.timeoutBusqueda);
    this.timeoutBusqueda = setTimeout(() => this.cargar(), 400);
  }

  onZonaChange(valor: string) {
    this.filtroZona.set(valor ? Number(valor) : null);
    this.paginaActual.set(1);
    this.cargar();
  }

  irPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaActual.set(pagina);
    this.cargar();
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