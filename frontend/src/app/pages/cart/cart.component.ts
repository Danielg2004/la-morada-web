import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, Cart } from '../../services/cart.service';
import { OrdersService } from '../../services/orders.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  cart?: Cart;
  loading = false;

  constructor(private svc: CartService, private orders: OrdersService, private router: Router) {}

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.svc.get().subscribe({
      next: c => { this.cart = c; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  inc(it: any) {
    this.svc.update(it.ebook_id, it.quantity + 1).subscribe({ next: c => this.cart = c as any });
  }
  dec(it: any) {
    const q = it.quantity - 1;
    this.svc.update(it.ebook_id, q).subscribe({ next: c => this.cart = c as any });
  }
  clear() {
    this.svc.clear().subscribe({ next: () => this.load() });
  }

  checkout() {
    this.orders.checkout().subscribe({
      next: (res) => {
        // simular pasarela: pedir confirmación al "payment_intent"
        const pid = res.payment_intent.id;
        this.orders.confirmPayment(pid).subscribe({
          next: () => {
            alert('Pago aprobado. ¡Gracias!');
            this.router.navigate(['/ebooks']); // o una página "Mis compras"
          }
        });
      },
      error: () => alert('No se pudo iniciar el checkout'),
    });
  }
}
