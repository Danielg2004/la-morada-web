import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  nombre: string | null = null;
  rol: string | null = null;
  tipDelDia: string | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.getUserFromToken();
    this.nombre = user?.nombre || 'Usuario';
    this.rol = user?.rol || null;
    if (this.rol === 'paciente') {
      this.tipDelDia = 'Respira profundo 2 minutos y toma agua.';
    }
  }
}
