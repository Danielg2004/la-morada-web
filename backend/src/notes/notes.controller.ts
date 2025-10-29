import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NoteDto } from './dto/note.dto';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private notes: NotesService) {}

  @Get()
  listMine(@Req() req: any, @Query('q') q?: string) {
    return this.notes.listMine(req.user.userId, q);
  }

  @Get(':id')
  detail(@Param('id') id: string, @Req() req: any) {
    return this.notes.detail(id, req.user.userId);
  }

  @Post()
  create(@Body() dto: NoteDto, @Req() req: any) {
    return this.notes.create(dto, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: NoteDto, @Req() req: any) {
    return this.notes.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.notes.remove(id, req.user.userId);
  }
}
