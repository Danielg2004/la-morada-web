import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { EbookService } from '../../services/ebook.service';
import { CartService } from '../../services/cart.service';
import { AuthService, CurrentUser } from '../../services/auth.service';
import { Ebook } from '../../models/ebook.model';

@Component({
  selector: 'app-ebooks-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ebooks-list.component.html',
  styleUrls: ['./ebooks-list.component.scss'],
})
export class EbooksListComponent implements OnInit {
  q = '';
  loading = false;
  ebooks: Ebook[] = [];
  showOnlyFavorites = false;

  user: CurrentUser | null = null;

  constructor(
    private ebooksSvc: EbookService,
    private cart: CartService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    // Mantener el usuario actualizado (login/logout reactivo)
    this.auth.currentUser$.subscribe(u => this.user = u);
    this.load();
  }

  load(): void {
    this.loading = true;

    const source$ = this.showOnlyFavorites
      ? this.ebooksSvc.myFavorites(this.q)
      : this.ebooksSvc.list(this.q);

    source$.subscribe({
      next: rows => {
        this.ebooks = rows;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  search(): void {
    this.load();
  }

  toggleFavorites(): void {
    this.showOnlyFavorites = !this.showOnlyFavorites;
    this.load();
  }

  canCreate(): boolean {
    return this.user?.rol === 'admin' || this.user?.rol === 'psicologo';
  }

  toggleFav(e: Ebook): void {
    if (!this.user) { alert('Inicia sesión para usar favoritos.'); return; }
    const call = e.es_favorito
      ? this.ebooksSvc.removeFavorite(e.id)
      : this.ebooksSvc.addFavorite(e.id);

    call.subscribe({
      next: () => e.es_favorito = !e.es_favorito,
    });
  }

  addToCart(e: Ebook): void {
    if (!this.user) { alert('Inicia sesión para comprar.'); return; }
    this.cart.add(e.id, 1).subscribe({
      next: () => alert('Agregado al carrito'),
      error: () => alert('No se pudo agregar'),
    });
  }

  // Helpers de UI
  isFree(e: Ebook): boolean {
    return Number(e.price) === 0;
  }
}
