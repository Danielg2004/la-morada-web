import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PodcastsService } from './podcasts.service';
import { CreatePodcastDto } from './dto/create-podcast.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('podcasts')
export class PodcastsController {
  constructor(private podcasts: PodcastsService) {}

  // Público (pero si hay userId, marcamos favoritos en la respuesta)
  @Get()
  list(@Req() req: any, @Query('q') q?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const userId = req?.user?.userId;
    return this.podcasts.list(q, limit ? Number(limit) : 20, offset ? Number(offset) : 0, userId);
  }

  // Público (idem)
  @Get(':id')
  detail(@Param('id') id: string, @Req() req: any) {
    const userId = req?.user?.userId;
    return this.podcasts.detail(id, userId);
  }

  // Crear: psicólogo/admin
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('psicologo', 'admin')
  create(@Body() dto: CreatePodcastDto, @Req() req: any) {
    return this.podcasts.create(dto, req.user.userId);
  }

  // Eliminar: psicólogo/admin o autor
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.podcasts.remove(id, req.user.userId, req.user.rol);
  }

  // Favoritos
  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  addFavorite(@Param('id') id: string, @Req() req: any) {
    return this.podcasts.addFavorite(id, req.user.userId);
  }

  @Delete(':id/favorite')
  @UseGuards(JwtAuthGuard)
  removeFavorite(@Param('id') id: string, @Req() req: any) {
    return this.podcasts.removeFavorite(id, req.user.userId);
  }

  @Get('me/favorites/list')
  @UseGuards(JwtAuthGuard)
  myFavorites(@Req() req: any, @Query('q') q?: string) {
    return this.podcasts.myFavorites(req.user.userId, q);
  }

  // Progreso
  @Get(':id/progress')
  @UseGuards(JwtAuthGuard)
  getProgress(@Param('id') id: string, @Req() req: any) {
    return this.podcasts.getProgress(id, req.user.userId);
  }

  @Post(':id/progress')
  @UseGuards(JwtAuthGuard)
  setProgress(@Param('id') id: string, @Body('segundos') segundos: number, @Req() req: any) {
    return this.podcasts.setProgress(id, req.user.userId, segundos);
  }
}
