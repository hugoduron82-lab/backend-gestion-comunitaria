import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Configuracion {
  id: number;
  clave: string;
  valor: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private apiUrl = `${environment.apiUrl}/configuracion`;

  constructor(private http: HttpClient) {}

  // Listar todas las configuraciones
  listar(): Observable<Configuracion[]> {
    return this.http.get<Configuracion[]>(this.apiUrl);
  }

  // Obtener una configuración por ID
  obtener(id: number): Observable<Configuracion> {
    return this.http.get<Configuracion>(`${this.apiUrl}/${id}`);
  }

  // Crear nueva configuración
  crear(data: { clave: string; valor: string; descripcion?: string }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Actualizar configuración
  actualizar(id: number, data: { valor: string; descripcion?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // Eliminar configuración
  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}