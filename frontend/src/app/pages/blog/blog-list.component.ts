import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { BlogPost } from '../../models/blog.model';
import { AuthService, CurrentUser } from '../../services/auth.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss'],
})
export class BlogListComponent implements OnInit {
  posts: BlogPost[] = [];
  q = '';
  loading = false;
  user: CurrentUser | null = null;

  constructor(private blog: BlogService, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => this.user = u);
    this.load();
  }

  load() {
    this.loading = true;
    this.blog.list(this.q).subscribe({
      next: (rows) => { this.posts = rows; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  search() { this.load(); }

  canCreate() {
    return this.user?.rol === 'admin' || this.user?.rol === 'psicologo';
  }
}
