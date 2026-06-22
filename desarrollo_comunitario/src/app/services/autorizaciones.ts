import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AutorizacionesService {
  private apiUrl = 'http://localhost:3001/api/autorizaciones';

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<any[]>(this.apiUrl);
  }

  crear(datos: any) {
    return this.http.post<any>(this.apiUrl, datos);
  }
}