import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

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

export interface CurrentUser {
  userId: string;
  rol: string;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  /** Observable público para que los componentes se suscriban */
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Al cargar la app, si hay token válido en localStorage, emítelo
    const user = this.getUserFromToken();
    if (user) this.currentUserSubject.next(user);
  }

  registrar(data: RegistroRequest): Observable<any> {
    return this.http.post(`${API_URL}/users/register`, data);
  }

  login(data: LoginRequest): Observable<any> {
    return this.http.post(`${API_URL}/auth/login`, data).pipe(
      tap((resp: any) => {
        if (resp?.token) {
          localStorage.setItem('token', resp.token);
          const u = this.getUserFromToken();
          this.currentUserSubject.next(u); // <-- Notificar al header/home
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null); // <-- Notificar cierre de sesión
  }

  getToken() { return localStorage.getItem('token'); }

  getUserFromToken(): CurrentUser | null {
    const t = this.getToken();
    if (!t) return null;
    try {
      const dec: any = jwtDecode(t);
      // dec debe contener { userId, rol, nombre }
      if (dec?.userId && dec?.rol) {
        return { userId: dec.userId, rol: dec.rol, nombre: dec.nombre };
      }
      return null;
    } catch {
      return null;
    }
  }
}
