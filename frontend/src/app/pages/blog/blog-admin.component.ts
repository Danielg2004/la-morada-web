import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-blog-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './blog-admin.component.html',
  styleUrls: ['./blog-admin.component.scss'],
})
export class BlogAdminComponent {
  form!: FormGroup;
  serverError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private blog: BlogService,
    private router: Router,
    private auth: AuthService
  ) {
    // Inicializa el form en el constructor
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      contenido: ['', [Validators.required, Validators.maxLength(20000)]],
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.serverError = null;
    this.blog.create(this.form.value as any).subscribe({
      next: (p) => this.router.navigate(['/blog', p.id]),
      error: (err) => this.serverError = err?.error?.message || 'No se pudo crear la entrada.',
    });
  }
}
