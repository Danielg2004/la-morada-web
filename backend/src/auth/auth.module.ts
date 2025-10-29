import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    // Deja Passport con estrategia por defecto jwt (opcional pero recomendado)
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        // Nest types piden string | number; tu env es string, está OK
        expiresIn: (process.env.JWT_EXPIRES || '1d') as any,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // <-- REGISTRA LA ESTRATEGIA AQUÍ
  exports: [AuthService, PassportModule], // <-- exporta por si otros módulos lo usan
})
export class AuthModule {}
