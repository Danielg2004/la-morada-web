import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BlogPost } from '../models/blog.model';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class BlogService {
  constructor(private http: HttpClient) {}

  list(q?: string, limit = 20, offset = 0): Observable<BlogPost[]> {
    let params = new HttpParams().set('limit', String(limit)).set('offset', String(offset));
    if (q) params = params.set('q', q);
    return this.http.get<BlogPost[]>(`${API_URL}/blog`, { params });
  }

  detail(id: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${API_URL}/blog/${id}`);
  }

  create(payload: { titulo: string; contenido: string }): Observable<BlogPost> {
    return this.http.post<BlogPost>(`${API_URL}/blog`, payload);
  }

  remove(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/blog/${id}`);
  }
}
