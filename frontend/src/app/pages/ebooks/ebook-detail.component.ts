import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { EbookService } from '../../services/ebook.service';
import { Ebook } from '../../models/ebook.model';
import { AuthService, CurrentUser } from '../../services/auth.service';

@Component({
  selector: 'app-ebook-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './ebook-detail.component.html',
  styleUrls: ['./ebook-detail.component.scss'],
})
export class EbookDetailComponent implements OnInit {
  ebook?: Ebook;
  user: CurrentUser | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private svc: EbookService,
    private auth: AuthService,
    private router: Router
  ) {
    this.auth.currentUser$.subscribe((u) => (this.user = u));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.svc.detail(id).subscribe({
      next: (e) => { this.ebook = e; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  canManage(): boolean {
    return this.user?.rol === 'admin' || this.user?.rol === 'psicologo';
  }

  toggleFav(): void {
    if (!this.user || !this.ebook) { alert('Inicia sesión para usar favoritos.'); return; }
    const call = this.ebook.es_favorito
      ? this.svc.removeFavorite(this.ebook.id)
      : this.svc.addFavorite(this.ebook.id);
    call.subscribe({ next: () => (this.ebook!.es_favorito = !this.ebook!.es_favorito) });
  }

  // ⬇️ Acepta string | null | undefined para que el template no marque error
  openLink(url?: string | null): void {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
