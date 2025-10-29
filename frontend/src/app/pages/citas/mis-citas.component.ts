import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CitasService, Cita } from '../../services/citas.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-citas.component.html',
  styleUrls: ['./mis-citas.component.scss'],
})
export class MisCitasComponent implements OnInit {
  citas: Cita[] = [];
  loading = false;
  rol: string | null = null;

  constructor(private svc: CitasService, private auth: AuthService) {}

  ngOnInit(): void {
    const u = this.auth.getUserFromToken();
    this.rol = u?.rol || null;
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.misCitas().subscribe({
      next: (rows) => { this.citas = rows; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  cancelar(c: Cita) {
    if (c.estado !== 'reservada') return;
    if (!confirm('¿Cancelar esta cita?')) return;
    this.svc.cancelar(c.id).subscribe({
      next: () => this.load(),
      error: (e) => alert(e?.error?.message || 'No se pudo cancelar'),
    });
  }

  // ✅ Actualización optimista tras completar
  completar(c: Cita) {
    if (c.estado !== 'reservada') return;
    if (!confirm('¿Marcar esta cita como realizada?')) return;
    this.svc.completar(c.id).subscribe({
      next: (updated) => {
        const idx = this.citas.findIndex((x) => x.id === updated.id);
        if (idx >= 0) this.citas[idx] = { ...this.citas[idx], ...updated };
        // Si prefieres recargar desde servidor:
        // this.load();
      },
      error: (e) => alert(e?.error?.message || 'No se pudo completar'),
    });
  }
}
