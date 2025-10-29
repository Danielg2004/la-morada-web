import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { EbooksListComponent } from './pages/ebooks/ebooks-list.component';
import { EbookDetailComponent } from './pages/ebooks/ebook-detail.component';
import { EbookAdminComponent } from './pages/ebooks/ebook-admin.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'home', component: HomeComponent },

  // E-books
  { path: 'ebooks', component: EbooksListComponent },
  { path: 'ebooks/admin', component: EbookAdminComponent }, // el backend valida rol
  { path: 'ebooks/:id', component: EbookDetailComponent },
];
