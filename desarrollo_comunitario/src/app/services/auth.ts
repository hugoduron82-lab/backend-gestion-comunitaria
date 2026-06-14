import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class Auth {
  // ⚠️ Verifica el puerto en tu archivo .env real
  private apiUrl = 'http://localhost:5000/api/auth';

  constructor(private http: HttpClient) {}

  login(correo: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { correo, password });
  }

  guardarSesion(token: string, usuario: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUsuario() {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }
}