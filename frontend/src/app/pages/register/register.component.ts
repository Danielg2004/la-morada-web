import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, AbstractControl, ValidationErrors, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function passwordValidator(c: AbstractControl): ValidationErrors | null {
  const v = c.value || '';
  const e: any = {};
  if (v.length < 8) e.minLength = true;
  if (!/[a-z]/.test(v)) e.lowercase = true;
  if (!/[A-Z]/.test(v)) e.uppercase = true;
  if (!/[0-9]/.test(v)) e.number = true;
  if (!/[^A-Za-z0-9]/.test(v)) e.special = true;
  return Object.keys(e).length ? e : null;
}
function matchPassword(g: AbstractControl): ValidationErrors | null {
  const p = g.get('password')?.value, c2 = g.get('confirmPassword')?.value;
  return p && c2 && p !== c2 ? { mismatch: true } : null;
}
function customEmailValidator(c: AbstractControl): ValidationErrors | null {
  const v = c.value || '';
  return /^[^\s@]+@[^\s@]+\.(com|co|org|net|edu|gov)$/i.test(v) ? null : { dominio: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  form!: FormGroup;
  serverError: string | null = null;
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      segundo_nombre: [''],
      apellidos: ['', [Validators.required]],
      edad: [18, [Validators.required, Validators.min(18)]],
      cedula: ['', [Validators.required, Validators.minLength(6)]],
      correo: ['', [Validators.required, customEmailValidator]],
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: matchPassword });
  }

  get f() { return this.form.controls; }

  submit() {
    this.serverError = null;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;

    this.auth.registrar(this.form.value as any).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/login']); },
      error: (err) => { this.loading = false; this.serverError = err?.error?.message || 'Error en el registro.'; }
    });
  }
}
