import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Podcast } from '../models/podcast.model';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class PodcastsService {
  constructor(private http: HttpClient) {}

  list(q?: string, limit = 20, offset = 0): Observable<Podcast[]> {
    let params = new HttpParams().set('limit', String(limit)).set('offset', String(offset));
    if (q) params = params.set('q', q);
    return this.http.get<Podcast[]>(`${API_URL}/podcasts`, { params });
  }

  detail(id: string): Observable<Podcast> {
    return this.http.get<Podcast>(`${API_URL}/podcasts/${id}`);
  }

  create(payload: { titulo: string; descripcion: string; embed_url: string }): Observable<Podcast> {
    return this.http.post<Podcast>(`${API_URL}/podcasts`, payload);
  }

  remove(id: string) {
    return this.http.delete(`${API_URL}/podcasts/${id}`);
  }

  addFavorite(id: string) {
    return this.http.post(`${API_URL}/podcasts/${id}/favorite`, {});
  }

  removeFavorite(id: string) {
    return this.http.delete(`${API_URL}/podcasts/${id}/favorite`);
  }

  myFavorites(q?: string): Observable<Podcast[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<Podcast[]>(`${API_URL}/podcasts/me/favorites/list`, { params });
  }

  getProgress(id: string): Observable<{ segundos: number }> {
    return this.http.get<{ segundos: number }>(`${API_URL}/podcasts/${id}/progress`);
  }

  setProgress(id: string, segundos: number) {
    return this.http.post(`${API_URL}/podcasts/${id}/progress`, { segundos });
  }
}
