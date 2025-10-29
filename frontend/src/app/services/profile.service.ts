import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000';

export interface ProfileSummary {
  me: {
    id: string;
    nombre: string;
    segundo_nombre?: string | null;
    apellidos: string;
    correo: string;
    rol: 'paciente'|'psicologo'|'admin';
    creado_en: string;
  };
  rol: 'paciente'|'psicologo'|'admin';
  widgets: any;
  quickActions: { label: string; path: string }[];
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private http: HttpClient) {}

  summary(): Observable<ProfileSummary> {
    return this.http.get<ProfileSummary>(`${API_URL}/profile/summary`);
  }
}
