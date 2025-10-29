import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, CurrentUser } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  nombre: string | null = null;
  rol: string | null = null;
  tipDelDia: string | null = null;

  private sub?: Subscription;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    const setFromUser = (u: CurrentUser | null) => {
      this.nombre = u?.nombre || 'Usuario';
      this.rol = u?.rol || null;
      this.tipDelDia = this.rol === 'paciente' ? 'Respira profundo 2 minutos y toma agua.' : null;
    };

    // Suscríbete para reaccionar a cambios de sesión
    this.sub = this.auth.currentUser$.subscribe(setFromUser);

    // También inicializa con el valor actual (por si ya hay token)
    setFromUser(this.auth.getUserFromToken());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
