import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Servicio singleton: una sola instancia en toda la app.
// Cualquier componente que lo inyecte obtiene el mismo conteo de alertas.
@Injectable({ providedIn: 'root' })
export class BadgeAlertasService {
  private apiUrl = 'http://localhost:3001/api/organizaciones/alertas';
  totalAlertas = signal(0);
  private cargado = false;

  constructor(private http: HttpClient) {}

  // Cargar solo una vez por sesión (o forzar recarga)
  cargar(forzar = false) {
    if (this.cargado && !forzar) return;
    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        const total = (res.proximas_vencer?.length ?? 0) + (res.vencidas?.length ?? 0);
        this.totalAlertas.set(total);
        this.cargado = true;
      },
      error: () => {}
    });
  }

  // Forzar recarga — llamar después de renovar una organización
  // para que el badge se actualice automáticamente
  recargar() {
    this.cargado = false;
    this.cargar();
  }
}