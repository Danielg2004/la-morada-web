import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    // Debe reflejar EXACTAMENTE lo que firmas en AuthService (userId, rol, nombre)
    return {
      userId: payload.userId,
      rol: payload.rol,
      nombre: payload.nombre,
    };
  }
}
