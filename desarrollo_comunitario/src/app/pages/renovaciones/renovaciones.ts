import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { OrganizacionesService } from '../../services/organizaciones';
import { BadgeAlertasService } from '../../services/badge-alertas';

@Component({
  selector: 'app-renovaciones',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './renovaciones.html',
  styleUrl: './renovaciones.css'
})
export class Renovaciones implements OnInit {
  usuario: any;
  sidebarAbierto = signal(false);
  organizaciones = signal<any[]>([]);
  cargando = signal(true);
  busqueda = signal('');
  private timeoutBusqueda: any;

  constructor(
    private auth: Auth,
    private router: Router,
    private orgService: OrganizacionesService,
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
  }

  cargar() {
    this.cargando.set(true);
    this.orgService.listar({
      estado: 'vencida',
      busqueda: this.busqueda(),
      porPagina: 100
    }).subscribe({
      next: (res) => {
        this.organizaciones.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando organizaciones vencidas:', err);
        this.cargando.set(false);
      }
    });
  }

  onBusquedaChange(valor: string) {
    this.busqueda.set(valor);
    clearTimeout(this.timeoutBusqueda);
    this.timeoutBusqueda = setTimeout(() => this.cargar(), 400);
  }

  diasVencida(o: any): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(o.fecha_vencimiento);
    return Math.round((hoy.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
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
