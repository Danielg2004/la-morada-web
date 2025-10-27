export type UserRole = 'paciente' | 'psicologo' | 'admin';

export class UserEntity {
  id: string;
  nombre: string;
  segundo_nombre: string | null;
  apellidos: string;
  edad: number;
  cedula: string;
  correo: string;
  password_hash: string;
  rol: UserRole;
  creado_en: Date;
}
