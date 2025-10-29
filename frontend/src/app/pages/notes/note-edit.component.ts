import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NotesService } from '../../services/notes.service';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-note-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './note-edit.component.html',
  styleUrls: ['./note-edit.component.scss'],
})
export class NoteEditComponent implements OnInit {
  form!: FormGroup;
  noteId!: string;
  loading = false;
  serverError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private notes: NotesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Inicializa el form en el constructor
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      contenido: ['', [Validators.required, Validators.maxLength(10000)]],
    });
  }

  ngOnInit(): void {
    this.noteId = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.notes.detail(this.noteId).subscribe({
      next: (n: Note) => {
        this.form.patchValue({ titulo: n.titulo, contenido: n.contenido });
        this.loading = false;
      },
      error: () => { this.loading = false; this.serverError = 'No se pudo cargar la nota.'; },
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.serverError = null;
    this.notes.update(this.noteId, this.form.value as any).subscribe({
      next: () => this.router.navigate(['/notas']),
      error: (err) => this.serverError = err?.error?.message || 'No se pudo guardar.',
    });
  }
}
