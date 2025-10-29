import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('blog')
export class BlogController {
  constructor(private blog: BlogService) {}

  // Público
  @Get()
  list(@Query('q') q?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.blog.list(q, limit ? Number(limit) : 20, offset ? Number(offset) : 0);
  }

  // Público
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.blog.detail(id);
  }

  // Crear: psicólogo/admin
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('psicologo', 'admin')
  create(@Body() dto: CreateBlogDto, @Req() req: any) {
    return this.blog.create(dto, req.user.userId);
  }

  // Eliminar: psicólogo/admin o autor
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.blog.remove(id, req.user.userId, req.user.rol);
  }
}
