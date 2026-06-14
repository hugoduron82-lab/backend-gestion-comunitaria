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

@Injectable({ providedIn: 'root' })
export class OrganizacionesService {
  private apiUrl = 'http://localhost:5000/api/organizaciones';

  constructor(private http: HttpClient) {}

  obtenerDashboard() {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
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

  crear(datos: any) {
    return this.http.post<any>(this.apiUrl, datos);
  }
}