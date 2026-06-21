import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DirectivaService {
  private apiUrl = 'http://localhost:5000/api/directiva';

  constructor(private http: HttpClient) {}

  listar(idOrganizacion: number) {
    return this.http.get<any[]>(`${this.apiUrl}/organizacion/${idOrganizacion}`);
  }

  asignarMiembro(datos: any) {
    return this.http.post<any>(`${this.apiUrl}/miembros`, datos);
  }

  actualizarMiembro(id: number, datos: any) {
    return this.http.put<any>(`${this.apiUrl}/miembros/${id}`, datos);
  }

  desactivarMiembro(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/miembros/${id}`);
  }

  renovar(idOrganizacion: number, miembros: any[], motivo?: string) {
    return this.http.post<any>(`${this.apiUrl}/renovar`, {
      id_organizacion: idOrganizacion,
      miembros,
      motivo
    });
  }

  // Buscar presidente activo por DNI para autocompletar formulario
  // de autorización especial
  buscarPorDni(dni: string) {
    return this.http.get<any>(`${this.apiUrl}/buscar-por-dni/${dni}`);
  }
}