import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Rol {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  id_empleado: number;
  correo: string;
  id_rol: number;
  activo: boolean;
  creado_en?: Date;
  actualizado_en?: Date;
  rol?: Rol;
}

export interface UsuariosResponse {
  total: number;
  pagina: number;
  totalPaginas: number;
  usuarios: Usuario[];
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(filtros?: any): Observable<UsuariosResponse> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== undefined && filtros[key] !== '') {
          params = params.set(key, filtros[key].toString());
        }
      });
    }
    return this.http.get<UsuariosResponse>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  crear(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  actualizar(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  desactivar(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/desactivar`, {});
  }

  reactivar(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/reactivar`, {});
  }
}