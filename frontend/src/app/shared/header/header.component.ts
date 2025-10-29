import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, CurrentUser } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  user: CurrentUser | null = null;
  cartCount = 0;

  constructor(
    private auth: AuthService,
    private cart: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => {
      this.user = u;
      if (u) this.cart.refresh();
      else this.cartCount = 0;
    });
    this.cart.cartCount$.subscribe(n => this.cartCount = n);
  }

  // ✅ usados en el template
  get isLogged(): boolean {
    return !!this.user;
  }
  get isAdminOrPsy(): boolean {
    return this.user?.rol === 'admin' || this.user?.rol === 'psicologo';
  }

  logout(): void {
    this.auth.logout();
    this.cartCount = 0;
    this.router.navigate(['/login']);
  }
}
