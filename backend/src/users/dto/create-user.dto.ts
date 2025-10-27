import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Matches,
  MinLength,
  MaxLength,
  IsEmail,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsString()
  @IsOptional()
  segundo_nombre?: string;

  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  apellidos: string;

  @IsInt({ message: 'La edad debe ser un número entero.' })
  @Min(18, { message: 'Debes tener mínimo 18 años.' })
  edad: number;

  @IsString()
  @MinLength(6, { message: 'La cédula debe tener al menos 6 caracteres.' })
  cedula: string;

  // Validaremos formato custom para correo (no solo IsEmail). 
  // Aun así usamos IsEmail para mensaje básico.
  @IsEmail({}, { message: 'El correo debe tener un formato válido (incluye @).' })
  @Matches(/^[^\s@]+@[^\s@]+\.(com|co|org|net|edu|gov)$/i, {
    message:
      'El correo debe terminar en dominios comunes (.com, .co, .org, .net, .edu, .gov).',
  })
  correo: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres.' })
  @Matches(/[a-z]/, { message: 'La contraseña debe tener al menos una minúscula.' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe tener al menos una mayúscula.' })
  @Matches(/[0-9]/, { message: 'La contraseña debe tener al menos un número.' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'La contraseña debe tener al menos un carácter especial.',
  })
  password: string;

  @IsString()
  confirmPassword: string;
}
