import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, CurrentUser } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnDestroy {
  user: CurrentUser | null = null;
  private sub: Subscription;

  constructor(private auth: AuthService, private router: Router) {
    // Suscribirse para actualizarse automáticamente cuando cambie el login/logout
    this.sub = this.auth.currentUser$.subscribe(u => this.user = u);
  }

  get isLogged(): boolean {
    return !!this.user;
  }

  get isAdminOrPsy(): boolean {
    return this.user?.rol === 'admin' || this.user?.rol === 'psicologo';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
