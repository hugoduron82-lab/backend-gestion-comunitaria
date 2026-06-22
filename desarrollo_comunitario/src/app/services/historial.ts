import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

interface FiltrosHistorial {
  busqueda?: string;
  zona?: number | null;
  pagina?: number;
  porPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private apiUrl = 'http://localhost:3001/api/historial-directivas';

  constructor(private http: HttpClient) {}

  listar(filtros: FiltrosHistorial = {}) {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(clave, valor.toString());
      }
    });
    return this.http.get<any>(this.apiUrl, { params });
  }
}