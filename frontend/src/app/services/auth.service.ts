import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode'; // <-- CAMBIO: import nombrado

const API_URL = 'http://localhost:3000';

export interface RegistroRequest {
  nombre: string;
  segundo_nombre?: string;
  apellidos: string;
  edad: number;
  cedula: string;
  correo: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  registrar(data: RegistroRequest): Observable<any> {
    return this.http.post(`${API_URL}/users/register`, data);
  }

  login(data: LoginRequest): Observable<any> {
    return this.http.post(`${API_URL}/auth/login`, data).pipe(
      tap((resp: any) => resp?.token && localStorage.setItem('token', resp.token))
    );
  }

  logout() { localStorage.removeItem('token'); }
  getToken() { return localStorage.getItem('token'); }

  getUserFromToken(): { userId: string; rol: string; nombre: string } | null {
    const t = this.getToken();
    if (!t) return null;
    try { return jwtDecode(t) as any; } catch { return null; }
  }
}
