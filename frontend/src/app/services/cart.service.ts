import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

const API_URL = 'http://localhost:3000';

export interface CartItem {
  id: string;
  ebook_id: string;
  titulo: string;
  price: number;
  quantity: number;
  imagen_url?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private _cartCount = new BehaviorSubject<number>(0);
  /** Contador reactivo para mostrar en el header */
  cartCount$ = this._cartCount.asObservable();

  constructor(private http: HttpClient) {}

  /** Cargar carrito y actualizar contador (útil al iniciar sesión o recargar) */
  refresh(): void {
    this.get().subscribe({
      next: (c) => this._cartCount.next(c.items?.reduce((s, i) => s + i.quantity, 0) || 0),
      error: () => this._cartCount.next(0),
    });
  }

  get(): Observable<Cart> {
    return this.http.get<Cart>(`${API_URL}/cart`).pipe(
      tap((c) => this._cartCount.next(c.items?.reduce((s, i) => s + i.quantity, 0) || 0))
    );
  }

  add(ebookId: string, quantity = 1) {
    return this.http.post<Cart>(`${API_URL}/cart/items`, { ebookId, quantity }).pipe(
      tap((c) => this._cartCount.next(c.items?.reduce((s, i) => s + i.quantity, 0) || 0))
    );
  }

  update(ebookId: string, quantity: number) {
    return this.http.post<Cart>(`${API_URL}/cart/items/update`, { ebookId, quantity }).pipe(
      tap((c) => this._cartCount.next(c.items?.reduce((s, i) => s + i.quantity, 0) || 0))
    );
  }

  clear() {
    return this.http.delete(`${API_URL}/cart/items`).pipe(
      tap(() => this._cartCount.next(0))
    );
  }
}
