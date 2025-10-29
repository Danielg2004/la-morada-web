import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DisponibilidadesService } from './disponibilidades.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('disponibilidades')
export class DisponibilidadesController {
  constructor(private svc: DisponibilidadesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('psicologo', 'admin')
  createBulk(@Req() req: any, @Body() body: { fecha: string; horas: string[] }) {
    return this.svc.createBulk(req.user.userId, body.fecha, body.horas);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('psicologo', 'admin')
  listMine(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.listMine(req.user.userId, from, to);
  }

  @Get('slots')
  daySlots(@Query('psicologoId') psicologoId: string, @Query('fecha') fecha: string) {
    return this.svc.daySlots(psicologoId, fecha);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('psicologo', 'admin')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.svc.remove(req.user.userId, id);
  }
}
