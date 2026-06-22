import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

interface FiltrosOrganizaciones {
  pagina?: number;
  porPagina?: number;
  zona?: number | null;
  tipo?: number | null;
  categoria?: string;
  estado?: string;
  busqueda?: string;
}

interface FiltrosReporte {
  zona?: number | null;
  tipo?: number | null;
  categoria?: string;
  busqueda?: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizacionesService {
  private apiUrl = 'http://localhost:3001/api/organizaciones';

  constructor(private http: HttpClient) {}

  obtenerDashboard() {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }

  obtenerAlertas() {
    return this.http.get<any>(`${this.apiUrl}/alertas`);
  }

  // Reporte completo para regidores: todas las organizaciones,
  // con presidente y teléfono, filtrable por tipo/zona/categoría
  obtenerReporte(filtros: FiltrosReporte = {}) {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '' && valor !== 'todos') {
        params = params.set(clave, valor.toString());
      }
    });
    return this.http.get<any[]>(`${this.apiUrl}/reporte`, { params });
  }

  listar(filtros: FiltrosOrganizaciones = {}) {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '' && valor !== 'todos') {
        params = params.set(clave, valor.toString());
      }
    });
    return this.http.get<any>(this.apiUrl, { params });
  }

  obtenerPorId(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crear(datos: any) {
    return this.http.post<any>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, datos);
  }

  renovar(id: number, datos: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}/renovar`, datos);
  }
}