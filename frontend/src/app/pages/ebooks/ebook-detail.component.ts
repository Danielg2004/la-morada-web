import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EbookService } from '../../services/ebook.service';
import { Ebook } from '../../models/ebook.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ebook-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ebook-detail.component.html',
  styleUrls: ['./ebook-detail.component.scss'],
})
export class EbookDetailComponent implements OnInit {
  ebook?: Ebook;
  loading = false;
  user: { userId: string; rol: string; nombre: string } | null = null;

  constructor(
    private route: ActivatedRoute,
    private ebooksSvc: EbookService,
    private auth: AuthService
  ) {
    this.user = this.auth.getUserFromToken(); // mover aquí
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.ebooksSvc.detail(id).subscribe({
      next: (e) => { this.ebook = e; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  canDelete(): boolean {
    return this.user?.rol === 'admin' || this.user?.rol === 'psicologo';
  }

  delete() {
    if (!this.ebook) return;
    if (!this.canDelete()) { alert('No autorizado'); return; }
    if (!confirm('¿Eliminar este e-book?')) return;
    this.ebooksSvc.remove(this.ebook.id).subscribe({
      next: () => { history.back(); },
    });
  }

  openLink(url?: string) {
    if (url) window.open(url, '_blank');
  }
}
