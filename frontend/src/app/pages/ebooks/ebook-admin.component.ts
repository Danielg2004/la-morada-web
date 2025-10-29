import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EbookService } from '../../services/ebook.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ebook-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './ebook-admin.component.html',
  styleUrls: ['./ebook-admin.component.scss'],
})
export class EbookAdminComponent {
  form!: FormGroup;
  serverError: string | null = null;
  user: { userId: string; rol: string; nombre: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private ebooksSvc: EbookService,
    private router: Router,
    private auth: AuthService
  ) {
    // Inicializar AQUÍ para evitar "used before initialization"
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      imagen_url: [''],
      archivo_url: [''],
      descripcion: ['', [Validators.maxLength(2000)]],
    });
    this.user = this.auth.getUserFromToken();
  }

  canCreate(): boolean {
    return this.user?.rol === 'admin' || this.user?.rol === 'psicologo';
  }

  submit() {
    if (!this.canCreate()) { this.serverError = 'No autorizado.'; return; }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.serverError = null;

    this.ebooksSvc.create(this.form.value as any).subscribe({
      next: (e) => this.router.navigate(['/ebooks', e.id]),
      error: (err) => this.serverError = err?.error?.message || 'No se pudo crear el e-book.',
    });
  }
}
