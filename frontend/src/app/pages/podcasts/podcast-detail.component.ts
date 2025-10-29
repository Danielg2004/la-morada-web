import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PodcastsService } from '../../services/podcasts.service';
import { Podcast } from '../../models/podcast.model';
import { AuthService, CurrentUser } from '../../services/auth.service';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-podcast-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SafeUrlPipe],
  templateUrl: './podcast-detail.component.html',
  styleUrls: ['./podcast-detail.component.scss'],
})
export class PodcastDetailComponent implements OnInit {
  p?: Podcast;
  user: CurrentUser | null = null;
  loading = false;

  // Progreso manual en segundos (no se puede leer desde iframes cross-origin)
  segundos = 0;

  constructor(
    private route: ActivatedRoute,
    private svc: PodcastsService,
    private auth: AuthService,
    private router: Router
  ) {
    this.auth.currentUser$.subscribe((u) => (this.user = u));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.svc.detail(id).subscribe({
      next: (pod) => {
        this.p = pod;
        this.segundos = Number(pod.progreso || 0);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  canManage() {
    return this.user?.rol === 'admin' || this.user?.rol === 'psicologo';
  }

  toggleFav() {
    if (!this.user || !this.p) {
      alert('Inicia sesión para usar favoritos.');
      return;
    }
    const call = this.p.es_favorito
      ? this.svc.removeFavorite(this.p.id)
      : this.svc.addFavorite(this.p.id);
    call.subscribe({
      next: () => (this.p!.es_favorito = !this.p!.es_favorito),
    });
  }

  saveProgress() {
    if (!this.user || !this.p) {
      alert('Inicia sesión para guardar progreso.');
      return;
    }
    this.svc.setProgress(this.p.id, Number(this.segundos) || 0).subscribe({
      next: () => alert('Progreso guardado.'),
    });
  }

  plus30() {
    this.segundos = Math.max(0, Number(this.segundos) + 30);
  }

  minus30() {
    this.segundos = Math.max(0, Number(this.segundos) - 30);
  }

  remove() {
    if (!this.p) return;
    if (!this.canManage()) {
      alert('No autorizado');
      return;
    }
    if (!confirm('¿Eliminar este podcast?')) return;
    this.svc.remove(this.p.id).subscribe({
      next: () => this.router.navigate(['/podcasts']),
    });
  }
}
