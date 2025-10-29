import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CitasService } from '../../services/citas.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-disponibilidad-psicologo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './disponibilidad-psicologo.component.html',
  styleUrls: ['./disponibilidad-psicologo.component.scss'],
})
export class DisponibilidadPsicologoComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  slots: any[] = [];
  rango = { from: '', to: '' };
  isPsy = false;

  horasCatalogo = ['08:00', '09:00', '10:00', '11:00','12:00','13:00', '14:00', '15:00', '16:00'];

  constructor(private fb: FormBuilder, private svc: CitasService, private auth: AuthService) {
    this.form = this.fb.group({
      fecha: ['', Validators.required],
      horas: this.fb.array(this.horasCatalogo.map(() => this.fb.control(false))),
    });
  }

  ngOnInit(): void {
    const u = this.auth.getUserFromToken();
    this.isPsy = !!u && (u.rol === 'psicologo' || u.rol === 'admin');
    if (!this.isPsy) alert('Solo psicólogos o admin pueden gestionar disponibilidad.');
    this.load();
  }

  get horasFA() { return this.form.get('horas') as FormArray; }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const fecha = this.form.value.fecha;
    const horas = this.horasCatalogo.filter((_, i) => this.horasFA.at(i).value === true);
    if (horas.length === 0) { alert('Selecciona al menos una hora'); return; }

    this.svc.crearDisponibilidad(fecha, horas).subscribe({
      next: () => { this.form.reset(); this.load(); },
      error: (e) => alert(e?.error?.message || 'No se pudo crear la disponibilidad'),
    });
  }

  load() {
    this.loading = true;
    this.svc.misDisponibilidades(this.rango.from || undefined, this.rango.to || undefined).subscribe({
      next: rows => { this.slots = rows; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  del(id: string) {
    if (!confirm('¿Eliminar disponibilidad?')) return;
    this.svc.borrarDisponibilidad(id).subscribe({
      next: () => this.load(),
      error: (e) => alert(e?.error?.message || 'No se pudo eliminar'),
    });
  }
}
