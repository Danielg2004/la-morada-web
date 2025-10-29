import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PodcastsService } from '../../services/podcasts.service';
import { Podcast } from '../../models/podcast.model';
import { AuthService, CurrentUser } from '../../services/auth.service';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-podcasts-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SafeUrlPipe],
  templateUrl: './podcasts-list.component.html',
  styleUrls: ['./podcasts-list.component.scss'],
})
export class PodcastsListComponent implements OnInit {
  q = '';
  loading = false;
  podcasts: Podcast[] = [];
  showOnlyFavorites = false;
  user: CurrentUser | null = null;

  constructor(private svc: PodcastsService, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => this.user = u);
    this.load();
  }

  load() {
    this.loading = true;
    const obs = this.showOnlyFavorites ? this.svc.myFavorites(this.q) : this.svc.list(this.q);
    obs.subscribe({
      next: rows => { this.podcasts = rows; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  search() { this.load(); }
  toggleFavorites() { this.showOnlyFavorites = !this.showOnlyFavorites; this.load(); }

  canCreate() { return this.user?.rol === 'admin' || this.user?.rol === 'psicologo'; }

  toggleFav(p: Podcast) {
    if (!this.user) { alert('Inicia sesión para usar favoritos.'); return; }
    const call = p.es_favorito ? this.svc.removeFavorite(p.id) : this.svc.addFavorite(p.id);
    call.subscribe({ next: () => p.es_favorito = !p.es_favorito });
  }

  share(p: Podcast) {
    const url = `${location.origin}/podcasts/${p.id}`;
    if ((navigator as any).share) (navigator as any).share({ title: p.titulo, url }).catch(() => {});
    else navigator.clipboard.writeText(url).then(() => alert('Enlace copiado.'));
  }
}
