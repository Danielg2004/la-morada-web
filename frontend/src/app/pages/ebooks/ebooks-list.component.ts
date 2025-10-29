import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EbookService } from '../../services/ebook.service';
import { Ebook } from '../../models/ebook.model';
import { AuthService } from '../../services/auth.service';

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
  user: { userId: string; rol: string; nombre: string } | null = null;

  constructor(private ebooksSvc: EbookService, private auth: AuthService) {
    this.user = this.auth.getUserFromToken(); // mover aquí
  }

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    const obs = this.showOnlyFavorites
      ? this.ebooksSvc.myFavorites(this.q)
      : this.ebooksSvc.list(this.q);
    obs.subscribe({
      next: (data) => { this.ebooks = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  search() { this.load(); }

  toggleFavorites() {
    this.showOnlyFavorites = !this.showOnlyFavorites;
    this.load();
  }

  canCreate(): boolean {
    return this.user?.rol === 'admin' || this.user?.rol === 'psicologo';
  }

  async share(ebook: Ebook) {
    const url = `${location.origin}/ebooks/${ebook.id}`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: ebook.titulo, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('Enlace copiado al portapapeles');
    }
  }

  toggleFav(ebook: Ebook) {
    if (!this.user) { alert('Inicia sesión para usar favoritos.'); return; }
    const call = ebook.es_favorito ? this.ebooksSvc.removeFavorite(ebook.id) : this.ebooksSvc.addFavorite(ebook.id);
    call.subscribe({ next: () => { ebook.es_favorito = !ebook.es_favorito; } });
  }
}
