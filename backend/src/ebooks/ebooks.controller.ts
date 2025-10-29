import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { EbooksService } from './ebooks.service';
import { CreateEbookDto } from './dto/create-ebook.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('ebooks')
export class EbooksController {
  constructor(private ebooks: EbooksService) {}

  // Público: listar con búsqueda/paginación
  @Get()
  async list(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: any,
  ) {
    const currentUserId = req?.user?.userId ?? null; // puede venir vacío (público)
    return this.ebooks.list({
      q,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
      favoriteOf: null, // para "mis favoritos" hay otra ruta
    });
  }

  // Público: detalle
  @Get(':id')
  async detail(@Param('id') id: string, @Req() req: any) {
    const currentUserId = req?.user?.userId ?? null;
    return this.ebooks.detail(id, currentUserId);
  }

  // Admin/Psicologo: crear
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'psicologo')
  async create(@Body() dto: CreateEbookDto, @Req() req: any) {
    return this.ebooks.create(dto, req.user.userId);
  }

  // Admin/Psicologo: eliminar
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'psicologo')
  async remove(@Param('id') id: string) {
    return this.ebooks.remove(id);
  }

  // Autenticado: agregar favorito
  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  async addFav(@Param('id') id: string, @Req() req: any) {
    return this.ebooks.addFavorite(id, req.user.userId);
  }

  // Autenticado: quitar favorito
  @Delete(':id/favorite')
  @UseGuards(JwtAuthGuard)
  async delFav(@Param('id') id: string, @Req() req: any) {
    return this.ebooks.removeFavorite(id, req.user.userId);
  }

  // Autenticado: listar SOLO mis favoritos
  @Get('me/favorites/list')
  @UseGuards(JwtAuthGuard)
  async myFavs(@Req() req: any, @Query('q') q?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.ebooks.list({
      q,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
      favoriteOf: req.user.userId,
    });
  }
}
