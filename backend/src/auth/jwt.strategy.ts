import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: any) {
    // payload se firma en AuthService con { userId, rol, nombre }
    // Algunos setups usan `sub`; aquí soportamos ambos por seguridad.
    const userId = payload.userId || payload.sub;
    return {
      userId,
      rol: payload.rol,
      nombre: payload.nombre,
    };
  }
}
