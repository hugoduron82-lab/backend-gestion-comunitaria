import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private apiUrl = 'http://localhost:5000/api/catalogos';

  constructor(private http: HttpClient) {}

  zonas() {
    return this.http.get<any>(`${this.apiUrl}/zonas`);
  }

  tipos() {
    return this.http.get<any>(`${this.apiUrl}/tipos-organizacion`);
  }
}