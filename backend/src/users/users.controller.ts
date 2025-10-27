import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.users.createPaciente(body);
  }
}
