import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Debes ingresar tu correo o cédula.' })
  identifier: string; // correo o cedula

  @IsString()
  @IsNotEmpty({ message: 'Debes ingresar tu contraseña.' })
  password: string;
}
