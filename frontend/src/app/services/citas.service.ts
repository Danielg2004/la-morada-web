import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000';

export interface PsicologoOption { id: string; nombre: string; }
export interface DisponibilidadSlot { id: string; hora: string; }
export interface Cita {
  id: string;
  psicologo_id: string;
  paciente_id: string;
  fecha: string;
  hora: string; // 'HH:MM'
  estado: 'reservada' | 'cancelada' | 'completada';
  creado_en?: string;
  psicologo_nombre?: string;
  psicologo_apellidos?: string;
  paciente_nombre?: string;
  paciente_apellidos?: string;
}

@Injectable({ providedIn: 'root' })
export class CitasService {
  constructor(private http: HttpClient) {}

  listPsicologos(): Observable<PsicologoOption[]> {
    return this.http.get<PsicologoOption[]>(`${API_URL}/citas/psicologos`);
  }

  daySlots(psicologoId: string, fecha: string): Observable<DisponibilidadSlot[]> {
    const params = new HttpParams().set('psicologoId', psicologoId).set('fecha', fecha);
    return this.http.get<DisponibilidadSlot[]>(`${API_URL}/disponibilidades/slots`, { params });
  }

  reservar(psicologoId: string, fecha: string, hora: string): Observable<Cita> {
    return this.http.post<Cita>(`${API_URL}/citas`, { psicologoId, fecha, hora });
  }

  misCitas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${API_URL}/citas/mine`);
  }

  cancelar(id: string) {
    return this.http.delete(`${API_URL}/citas/${id}`);
  }

  // Psicólogo
  crearDisponibilidad(fecha: string, horas: string[]) {
    return this.http.post(`${API_URL}/disponibilidades`, { fecha, horas });
  }

  misDisponibilidades(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<any[]>(`${API_URL}/disponibilidades/mine`, { params });
  }

  borrarDisponibilidad(id: string) {
    return this.http.delete(`${API_URL}/disponibilidades/${id}`);
  }

  // ✅ completar cita: retorna la cita actualizada
  completar(id: string) {
    return this.http.patch<Cita>(`${API_URL}/citas/${id}/completar`, {});
  }
}
