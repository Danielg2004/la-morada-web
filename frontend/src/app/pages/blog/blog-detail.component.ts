import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { BlogPost } from '../../models/blog.model';
import { AuthService, CurrentUser } from '../../services/auth.service';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.scss'],
})
export class BlogDetailComponent implements OnInit {
  post?: BlogPost;
  user: CurrentUser | null = null;
  loading = false;

  constructor(private route: ActivatedRoute, private svc: BlogService, private auth: AuthService, private router: Router) {
    this.auth.currentUser$.subscribe(u => this.user = u);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.svc.detail(id).subscribe({
      next: (p) => { this.post = p; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  canDelete() {
    return this.user?.rol === 'admin' || this.user?.rol === 'psicologo';
  }

  remove() {
    if (!this.post) return;
    if (!this.canDelete()) { alert('No autorizado'); return; }
    if (!confirm('¿Eliminar esta entrada?')) return;
    this.svc.remove(this.post.id).subscribe({
      next: () => this.router.navigate(['/blog']),
    });
  }
}
