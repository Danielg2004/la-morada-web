import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
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
  loading = false;
  serverError: string | null = null;

  // Declarar y luego inicializar en el constructor
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private ebooksSvc: EbookService,
    private router: Router,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      imagen_url: [''],
      archivo_url: [''],
      descripcion: ['', [Validators.maxLength(2000)]],
      // precio como string en el form; convertimos al enviar
      price: ['0', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    });
  }

  get f() { return this.form.controls; }

  submit() {
    this.serverError = null;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;

    const raw = this.form.value as {
      titulo: string;
      imagen_url?: string | null;
      archivo_url?: string | null;
      descripcion?: string | null;
      price?: string | number | null;
    };

    const priceNum =
      raw.price === null || raw.price === undefined || raw.price === ''
        ? 0
        : Number(raw.price);

    const payload = {
      titulo: raw.titulo,
      imagen_url: raw.imagen_url || null,
      archivo_url: raw.archivo_url || null,
      descripcion: raw.descripcion || null,
      price: isNaN(priceNum) ? 0 : Math.max(0, priceNum),
    };

    this.ebooksSvc.create(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/ebooks']);
      },
      error: (err) => {
        this.loading = false;
        this.serverError = err?.error?.message || 'No se pudo crear el e-book.';
      }
    });
  }
}
