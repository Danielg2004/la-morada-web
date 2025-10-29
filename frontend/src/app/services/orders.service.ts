import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  constructor(private http: HttpClient) {}

  checkout() {
    return this.http.post<{ order: any; payment_intent: any }>(`${API_URL}/orders/checkout`, {});
  }

  confirmPayment(payment_intent_id: string) {
    return this.http.post<{ ok: boolean; order_id: string }>(`${API_URL}/payments/confirm`, { payment_intent_id });
  }
}
