import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ebook } from '../models/ebook.model';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class EbookService {
  constructor(private http: HttpClient) {}

  list(q?: string, limit = 20, offset = 0): Observable<Ebook[]> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (q) params = params.set('q', q);
    return this.http.get<Ebook[]>(`${API_URL}/ebooks`, { params });
  }

  detail(id: string): Observable<Ebook> {
    return this.http.get<Ebook>(`${API_URL}/ebooks/${id}`);
  }

  create(payload: { titulo: string; imagen_url?: string; archivo_url?: string; descripcion?: string }): Observable<Ebook> {
    return this.http.post<Ebook>(`${API_URL}/ebooks`, payload);
  }

  remove(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/ebooks/${id}`);
  }

  addFavorite(id: string): Observable<any> {
    return this.http.post(`${API_URL}/ebooks/${id}/favorite`, {});
  }

  removeFavorite(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/ebooks/${id}/favorite`);
  }

  myFavorites(q?: string, limit = 20, offset = 0): Observable<Ebook[]> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (q) params = params.set('q', q);
    return this.http.get<Ebook[]>(`${API_URL}/ebooks/me/favorites/list`, { params });
  }
}
