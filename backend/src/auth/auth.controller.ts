import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  async login(@Body() body: { identifier: string; password: string }) {
    // body.identifier puede ser correo o cédula
    // body.password es la contraseña
    return this.auth.login(body.identifier, body.password);
  }
}
