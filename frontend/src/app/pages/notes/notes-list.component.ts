import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NotesService } from '../../services/notes.service';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
})
export class NotesListComponent implements OnInit {
  notes: Note[] = [];
  q = '';
  loading = false;

  form!: FormGroup;

  constructor(private notesSvc: NotesService, private fb: FormBuilder) {
    // Inicializa el form en el constructor
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      contenido: ['', [Validators.required, Validators.maxLength(10000)]],
    });
  }

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.notesSvc.list(this.q).subscribe({
      next: (rows) => { this.notes = rows; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  search() { this.load(); }

  create() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.notesSvc.create(this.form.value as any).subscribe({
      next: () => { this.form.reset(); this.load(); },
    });
  }

  remove(n: Note) {
    if (!confirm('¿Eliminar nota?')) return;
    this.notesSvc.remove(n.id).subscribe({
      next: () => this.load(),
    });
  }
}
