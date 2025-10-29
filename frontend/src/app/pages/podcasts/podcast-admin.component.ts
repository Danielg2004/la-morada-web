import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PodcastsService } from '../../services/podcasts.service';

@Component({
  selector: 'app-podcast-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './podcast-admin.component.html',
  styleUrls: ['./podcast-admin.component.scss'],
})
export class PodcastAdminComponent {
  form!: FormGroup;
  serverError: string | null = null;

  constructor(private fb: FormBuilder, private svc: PodcastsService, private router: Router) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      descripcion: ['', [Validators.maxLength(1000)]],
      embed_url: ['', [Validators.required]],
    });
  }

  // Acepta <iframe ...> o URL normal y devuelve una URL embebible
  private normalizeEmbed(input: string): string {
    const val = (input || '').trim();

    // 1) Si pegaron un <iframe ...>, extraer el src
    const iframeSrc = val.match(/<iframe[^>]*\s+src=['"]([^'"]+)['"]/i)?.[1];
    const url = new URL((iframeSrc || val), window.location.origin);

    // 2) YouTube
    // watch?v=ID  ->  /embed/ID
    // youtu.be/ID ->  /embed/ID
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
      // shorts -> /embed/ID
      const isShort = url.pathname.startsWith('/shorts/');
      let id = '';
      if (url.hostname.includes('youtu.be')) {
        id = url.pathname.slice(1);
      } else if (isShort) {
        id = url.pathname.split('/')[2] || '';
      } else {
        id = url.searchParams.get('v') || '';
      }
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    // 3) Spotify
    // open.spotify.com/episode/ID -> /embed/episode/ID
    // open.spotify.com/show/ID    -> /embed/show/ID
    // open.spotify.com/track/ID   -> /embed/track/ID
    if (url.hostname.includes('open.spotify.com')) {
      const parts = url.pathname.split('/').filter(Boolean); // ["episode","ID"]
      if (parts.length >= 2) {
        const kind = parts[0]; // episode|show|track|playlist|album
        const id = parts[1];
        return `https://open.spotify.com/embed/${kind}/${id}`;
      }
    }

    // 4) SoundCloud
    // https://soundcloud.com/{user}/{track}
    // embed: https://w.soundcloud.com/player/?url=<original_url_encoded>
    if (url.hostname.includes('soundcloud.com')) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.toString())}`;
    }

    // 5) Si ya es un src embebible conocido, devolver tal cual
    // (youtube /embed/, open.spotify.com/embed, soundcloud player)
    if (
      /youtube\.com\/embed\//.test(url.toString()) ||
      /open\.spotify\.com\/embed\//.test(url.toString()) ||
      /w\.soundcloud\.com\/player\/\?url=/.test(url.toString())
    ) {
      return url.toString();
    }

    // Fallback: devolver lo que entró (puede fallar si el sitio bloquea iframe)
    return val;
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.serverError = null;

    const payload = { ...this.form.value };
    payload.embed_url = this.normalizeEmbed(payload.embed_url);

    this.svc.create(payload as any).subscribe({
      next: (p) => this.router.navigate(['/podcasts', p.id]),
      error: (err) => this.serverError = err?.error?.message || 'No se pudo crear el podcast.',
    });
  }
}
