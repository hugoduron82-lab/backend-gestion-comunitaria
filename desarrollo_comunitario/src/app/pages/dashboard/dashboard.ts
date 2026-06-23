import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { OrganizacionesService } from '../../services/organizaciones';
import { CatalogosService } from '../../services/catalogos';
import { BadgeAlertasService } from '../../services/badge-alertas';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  usuario: any;
  fechaHoy = '';
  dropdownEstadoAbierto = signal(false);
  sidebarAbierto = signal(false);
  stats = signal<any>(null);
  cargandoStats = signal(true);
  organizaciones = signal<any[]>([]);
  zonas = signal<any[]>([]);
  cargandoOrgs = signal(true);
  paginaActual = signal(1);
  totalPaginas = signal(1);
  totalRegistros = signal(0);
  porPagina = 12;
  filtroSemaforo = signal('todos');
  filtroCategoria = signal('todos');
  
  // Se cambia a filtroZone para mantener consistencia exacta con el HTML modificado
  filtroZone = signal<number | null>(null); 
  busqueda = signal('');
  private timeoutBusqueda: any;

  constructor(
    private auth: Auth,
    private router: Router,
    private orgService: OrganizacionesService,
    private catalogosService: CatalogosService,
    public badgeAlertas: BadgeAlertasService
  ) {
    this.usuario = this.auth.getUsuario();
  }

  ngOnInit() {
    this.fechaHoy = new Date().toLocaleDateString('es-HN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    this.cargarStats();
    this.cargarOrganizaciones();
    this.cargarZonas();
  }

  cargarStats() {
    this.orgService.obtenerDashboard().subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res[0] : res;
        const stats = {
          ...data,
          total_organizaciones: Number(data.total_organizaciones),
          total_activas: Number(data.total_activas),
          total_proximas_vencer: Number(data.total_proximas_vencer),
          total_vencidas: Number(data.total_vencidas),
          total_patronatos: Number(data.total_patronatos),
          total_juntas_agua: Number(data.total_juntas_agua),
        };
        this.stats.set(stats);
        
        this.badgeAlertas.totalAlertas.set(
          stats.total_proximas_vencer + stats.total_vencidas
        );
        this.cargandoStats.set(false);
      },
      error: (err) => {
        console.error('Error cargando estadísticas:', err);
        this.cargandoStats.set(false);
      }
    });
  }

  cargarOrganizaciones() {
    this.cargandoOrgs.set(true);
    this.orgService.listar({
      pagina: this.paginaActual(),
      porPagina: this.porPagina,
      estado: this.filtroSemaforo(),
      categoria: this.filtroCategoria(),
      zona: this.filtroZone(),
      busqueda: this.busqueda()
    }).subscribe({
      next: (res) => {
        const datosOriginales = res.data ?? [];

        // Ordenamos las tarjetas por prioridad: 
        // 1. Próximas a vencer (Amarillas)
        // 2. Vencidas (Rojas)
        // 3. Activas (Verdes)
        const datosOrdenados = [...datosOriginales].sort((a, b) => {
          const orden: { [key: string]: number } = {
            'proxima_vencer': 1,
            'vencida': 2,
            'activa': 3
          };

          const prioridadA = orden[a.estado] || 4;
          const prioridadB = orden[b.estado] || 4;

          return prioridadA - prioridadB;
        });

        this.organizaciones.set(datosOrdenados);
        this.totalPaginas.set(res.totalPaginas ?? 1);
        this.totalRegistros.set(res.total ?? 0);
        this.cargandoOrgs.set(false);
      },
      error: (err) => {
        console.error('Error cargando organizaciones:', err);
        this.cargandoOrgs.set(false);
      }
    });
  }

  cargarZonas() {
    this.catalogosService.zonas().subscribe({
      next: (res) => this.zonas.set(Array.isArray(res) ? res : []),
      error: (err) => console.error('Error cargando zonas:', err)
    });
  }

  setSemaforo(valor: string) {
    this.filtroSemaforo.set(valor);
    this.paginaActual.set(1);
    this.cargarOrganizaciones();
  }

  setCategoria(valor: string) {
    this.filtroCategoria.set(valor);
    this.paginaActual.set(1);
    this.cargarOrganizaciones();
  }

  onZonaChange(valor: string) {
    this.filtroZone.set(valor ? parseInt(valor, 10) : null);
    this.paginaActual.set(1);
    this.cargarOrganizaciones();
  }

  onBusquedaChange(valor: string) {
    this.busqueda.set(valor);
    clearTimeout(this.timeoutBusqueda);
    this.timeoutBusqueda = setTimeout(() => {
      this.paginaActual.set(1);
      this.cargarOrganizaciones();
    }, 400);
  }

  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas()) return;
    this.paginaActual.set(p);
    this.cargarOrganizaciones();
  }

  diasParaVencer(o: any): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(o.fecha_vencimiento);
    return Math.round((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  textoVigencia(o: any): string {
    const dias = this.diasParaVencer(o);
    if (o.estado === 'vencida') return `Venció hace ${Math.abs(dias)} días`;
    return `Vence en ${dias} días`;
  }

  esAdmin()    { return this.usuario?.id_rol === 1; }
  esJefe()     { return this.usuario?.id_rol === 2; }
  esTecnico()  { return this.usuario?.id_rol === 3; }
  esConsulta() { return this.usuario?.id_rol === 4; }

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

  seleccionarEstado(valor: string) {
  this.setSemaforo(valor);
  this.dropdownEstadoAbierto.set(false); // Esto cierra el menú al hacer clic en una opción
}

}