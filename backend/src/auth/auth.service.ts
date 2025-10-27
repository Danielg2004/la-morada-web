import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
  ) {}

  async login(identifier: string, password: string) {
    // Buscar por correo O cédula
    const user = await this.usersService.findByCorreoOCedula(identifier);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Comparar passwords
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    // Firmar token con datos mínimos para el frontend
    const payload = {
      userId: user.id,
      rol: user.rol,
      nombre: user.nombre,
    };

    const token = await this.jwt.signAsync(payload);
    return { token };
  }
}
