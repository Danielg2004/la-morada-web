import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Note } from '../models/note.model';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class NotesService {
  constructor(private http: HttpClient) {}

  list(q?: string): Observable<Note[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<Note[]>(`${API_URL}/notes`, { params });
    }

  detail(id: string): Observable<Note> {
    return this.http.get<Note>(`${API_URL}/notes/${id}`);
  }

  create(payload: { titulo: string; contenido: string }): Observable<Note> {
    return this.http.post<Note>(`${API_URL}/notes`, payload);
  }

  update(id: string, payload: { titulo: string; contenido: string }): Observable<Note> {
    return this.http.put<Note>(`${API_URL}/notes/${id}`, payload);
  }

  remove(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/notes/${id}`);
  }
}
