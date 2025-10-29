import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProfileService, ProfileSummary } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  data?: ProfileSummary;
  loading = false;

  constructor(private svc: ProfileService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loading = true;
    this.svc.summary().subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  fullName() {
    if (!this.data) return '';
    const m = this.data.me;
    return [m.nombre, m.segundo_nombre, m.apellidos].filter(Boolean).join(' ');
  }
}
