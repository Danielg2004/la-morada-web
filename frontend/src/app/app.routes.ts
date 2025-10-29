import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { EbooksListComponent } from './pages/ebooks/ebooks-list.component';
import { EbookDetailComponent } from './pages/ebooks/ebook-detail.component';
import { EbookAdminComponent } from './pages/ebooks/ebook-admin.component';

// Blog
import { BlogListComponent } from './pages/blog/blog-list.component';
import { BlogAdminComponent } from './pages/blog/blog-admin.component';
import { BlogDetailComponent } from './pages/blog/blog-detail.component';

// Notas privadas
import { NotesListComponent } from './pages/notes/notes-list.component';
import { NoteEditComponent } from './pages/notes/note-edit.component';

// Podcasts
import { PodcastsListComponent } from './pages/podcasts/podcasts-list.component';
import { PodcastAdminComponent } from './pages/podcasts/podcast-admin.component';
import { PodcastDetailComponent } from './pages/podcasts/podcast-detail.component';

// Citas con psicólogos
import { DisponibilidadPsicologoComponent } from './pages/citas/disponibilidad-psicologo.component';
import { ReservarCitaComponent } from './pages/citas/reservar-cita.component';
import { MisCitasComponent } from './pages/citas/mis-citas.component';

// Perfil
import { ProfileComponent } from './pages/profile/profile.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'home', component: HomeComponent },

  // E-books
  { path: 'ebooks', component: EbooksListComponent },
  { path: 'ebooks/admin', component: EbookAdminComponent },
  { path: 'ebooks/:id', component: EbookDetailComponent },

  // Blog
  { path: 'blog', component: BlogListComponent },
  { path: 'blog/admin', component: BlogAdminComponent },
  { path: 'blog/:id', component: BlogDetailComponent },

  // Notas privadas
  { path: 'notas', component: NotesListComponent },
  { path: 'notas/:id', component: NoteEditComponent },

  // Podcasts
  { path: 'podcasts', component: PodcastsListComponent },
  { path: 'podcasts/admin', component: PodcastAdminComponent },
  { path: 'podcasts/:id', component: PodcastDetailComponent },

  // Citas con psicólogos
  { path: 'disponibilidad', component: DisponibilidadPsicologoComponent }, // psicólogo
  { path: 'citas/reservar', component: ReservarCitaComponent },            // paciente
  { path: 'citas', component: MisCitasComponent },                         // ambos

  // Perfil
  { path: 'perfil', component: ProfileComponent },

  { path: '**', redirectTo: 'home' }
];
