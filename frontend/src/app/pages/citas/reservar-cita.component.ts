import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitasService, PsicologoOption, DisponibilidadSlot } from '../../services/citas.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reservar-cita',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservar-cita.component.html',
  styleUrls: ['./reservar-cita.component.scss'],
})
export class ReservarCitaComponent implements OnInit {
  psicologos: PsicologoOption[] = [];
  psicologoId = '';
  fecha = '';
  horas: DisponibilidadSlot[] = [];
  hora = '';
  loading = false;

  constructor(private svc: CitasService, private auth: AuthService) {}

  ngOnInit(): void {
    const u = this.auth.getUserFromToken();
    if (!u) alert('Debes iniciar sesión para reservar.');
    this.svc.listPsicologos().subscribe(ps => this.psicologos = ps);
  }

  loadHoras() {
    this.horas = [];
    this.hora = '';
    if (this.psicologoId && this.fecha) {
      this.svc.daySlots(this.psicologoId, this.fecha).subscribe(sl => this.horas = sl);
    }
  }

  reservar() {
    if (!this.psicologoId || !this.fecha || !this.hora) {
      alert('Selecciona psicólogo, fecha y hora'); return;
    }
    this.loading = true;
    this.svc.reservar(this.psicologoId, this.fecha, this.hora).subscribe({
      next: () => { this.loading = false; alert('Cita reservada'); },
      error: (e) => { this.loading = false; alert(e?.error?.message || 'No se pudo reservar'); },
    });
  }
}
