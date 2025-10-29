import { Controller, Get, Post, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { EbooksService } from './ebooks.service';
import { CreateEbookDto } from './dto/create-ebook.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('ebooks')
export class EbooksController {
  constructor(private readonly svc: EbooksService) {}

  // GET /ebooks?q=...
  @Get()
  async list(@Req() req: any, @Query('q') q?: string) {
    const uid = req.user?.userId ?? null; // público o autenticado
    return this.svc.list(uid, q);
  }

  // GET /ebooks/:id
  @Get(':id')
  async detail(@Req() req: any, @Param('id') id: string) {
    const uid = req.user?.userId ?? null;
    return this.svc.detail(uid, id);
  }

  // NUEVO: GET /ebooks/:id/access (requiere auth)
  @Get(':id/access')
  @UseGuards(JwtAuthGuard)
  async access(@Req() req: any, @Param('id') id: string) {
    const ok = await this.svc.hasAccess(req.user.userId, id);
    return { hasAccess: ok };
  }

  // POST /ebooks (admin|psicologo)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'psicologo')
  async create(@Req() req: any, @Body() body: CreateEbookDto) {
    const user = { id: req.user.userId, rol: req.user.rol };
    return this.svc.create(user, body);
  }

  // DELETE /ebooks/:id (admin o autor)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    const user = { id: req.user.userId, rol: req.user.rol };
    return this.svc.remove(user, id);
  }

  // POST /ebooks/:id/favorite
  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  async addFavorite(@Req() req: any, @Param('id') id: string) {
    return this.svc.addFavorite(req.user.userId, id);
  }

  // DELETE /ebooks/:id/favorite
  @Delete(':id/favorite')
  @UseGuards(JwtAuthGuard)
  async removeFavorite(@Req() req: any, @Param('id') id: string) {
    return this.svc.removeFavorite(req.user.userId, id);
  }

  // GET /ebooks/me/favorites/list?q=...
  @Get('me/favorites/list')
  @UseGuards(JwtAuthGuard)
  async myFavorites(@Req() req: any, @Query('q') q?: string) {
    return this.svc.listMyFavorites(req.user.userId, q);
  }
}
