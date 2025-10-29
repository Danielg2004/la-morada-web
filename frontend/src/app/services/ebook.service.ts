import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ebook } from '../models/ebook.model';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class EbookService {
  constructor(private http: HttpClient) {}

  list(q = ''): Observable<Ebook[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<Ebook[]>(`${API_URL}/ebooks`, { params });
  }

  myFavorites(q = ''): Observable<Ebook[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<Ebook[]>(`${API_URL}/ebooks/me/favorites/list`, { params });
  }

  detail(id: string): Observable<Ebook> {
    return this.http.get<Ebook>(`${API_URL}/ebooks/${id}`);
  }

  create(data: Partial<Ebook>) {
    return this.http.post<Ebook>(`${API_URL}/ebooks`, data);
  }

  remove(id: string) {
    return this.http.delete(`${API_URL}/ebooks/${id}`);
  }

  addFavorite(id: string) {
    return this.http.post(`${API_URL}/ebooks/${id}/favorite`, {});
  }
  removeFavorite(id: string) {
    return this.http.delete(`${API_URL}/ebooks/${id}/favorite`);
  }

  // NUEVO: verificar acceso (compra/permiso)
  access(id: string): Observable<{ hasAccess: boolean }> {
    return this.http.get<{ hasAccess: boolean }>(`${API_URL}/ebooks/${id}/access`);
  }
}
