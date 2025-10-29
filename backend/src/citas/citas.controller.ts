import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CitasService } from './citas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('citas')
export class CitasController {
  constructor(private svc: CitasService) {}

  @Get('psicologos')
  listPsicologos() {
    return this.svc.listPsicologos();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  reservar(
    @Req() req: any,
    @Body() body: { psicologoId: string; fecha: string; hora: string },
  ) {
    return this.svc.reservar(
      req.user.userId,
      body.psicologoId,
      body.fecha,
      body.hora,
    );
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  listMine(@Req() req: any) {
    return this.svc.listMine(req.user.userId, req.user.rol);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  cancelar(@Req() req: any, @Param('id') id: string) {
    return this.svc.cancelar(req.user.userId, req.user.rol, id);
  }

  // ✅ PATCH para completar (reservada -> completada)
  @Patch(':id/completar')
  @UseGuards(JwtAuthGuard)
  completar(@Req() req: any, @Param('id') id: string) {
    return this.svc.completar(req.user.userId, req.user.rol, id);
  }
}
