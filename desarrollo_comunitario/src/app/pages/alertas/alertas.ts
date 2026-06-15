import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { OrganizacionesService } from '../../services/organizaciones';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './alertas.html',
  styleUrl: './alertas.css'
})
export class Alertas implements OnInit {
  usuario: any;
  sidebarAbierto = signal(false);

  proximasVencer = signal<any[]>([]);
  vencidas = signal<any[]>([]);
  cargando = signal(true);

  constructor(
    private auth: Auth,
    private router: Router,
    private orgService: OrganizacionesService
  ) {
    this.usuario = this.auth.getUsuario();
  }

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.orgService.obtenerAlertas().subscribe({
      next: (res) => {
        this.proximasVencer.set(res.proximas_vencer ?? []);
        this.vencidas.set(res.vencidas ?? []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando alertas:', err);
        this.cargando.set(false);
      }
    });
  }

  diasParaVencer(o: any): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(o.fecha_vencimiento);
    return Math.round((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  diasVencida(o: any): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(o.fecha_vencimiento);
    return Math.round((hoy.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
  }

  // El backend incluye "directiva" como array (where id_cargo=1, activo=true)
  presidente(o: any): any {
    return o.directiva?.[0] ?? null;
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