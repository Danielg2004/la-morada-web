import { Inject, Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { NoteDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async listMine(userId: string, q?: string) {
    try {
      let sql = `SELECT id, titulo, contenido, creado_en, actualizado_en FROM private_notes WHERE user_id = $1`;
      const vals: any[] = [userId];
      if (q) {
        sql += ` AND (LOWER(titulo) LIKE $2 OR LOWER(contenido) LIKE $2)`;
        vals.push(`%${q.toLowerCase()}%`);
      }
      sql += ` ORDER BY actualizado_en DESC, creado_en DESC`;
      const { rows } = await this.pool.query(sql, vals);
      return rows;
    } catch (e) {
      console.error('[NotesService] listMine', e);
      throw new InternalServerErrorException('No se pudieron listar las notas');
    }
  }

  async detail(id: string, userId: string) {
    try {
      const { rows } = await this.pool.query(`SELECT * FROM private_notes WHERE id = $1 AND user_id = $2`, [id, userId]);
      if (!rows[0]) throw new NotFoundException('Nota no encontrada');
      return rows[0];
    } catch (e) {
      if (e?.status === 404) throw e;
      console.error('[NotesService] detail', e);
      throw new InternalServerErrorException('No se pudo obtener la nota');
    }
  }

  async create(dto: NoteDto, userId: string) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO private_notes (user_id, titulo, contenido)
         VALUES ($1,$2,$3)
         RETURNING id, titulo, contenido, creado_en, actualizado_en`,
        [userId, dto.titulo, dto.contenido],
      );
      return rows[0];
    } catch (e) {
      console.error('[NotesService] create', e);
      throw new InternalServerErrorException('No se pudo crear la nota');
    }
  }

  async update(id: string, dto: NoteDto, userId: string) {
    try {
      const { rows } = await this.pool.query(
        `UPDATE private_notes
         SET titulo = $1, contenido = $2, actualizado_en = NOW()
         WHERE id = $3 AND user_id = $4
         RETURNING id, titulo, contenido, creado_en, actualizado_en`,
        [dto.titulo, dto.contenido, id, userId],
      );
      if (!rows[0]) throw new NotFoundException('Nota no encontrada');
      return rows[0];
    } catch (e) {
      if (e?.status === 404) throw e;
      console.error('[NotesService] update', e);
      throw new InternalServerErrorException('No se pudo actualizar la nota');
    }
  }

  async remove(id: string, userId: string) {
    try {
      const res = await this.pool.query(`DELETE FROM private_notes WHERE id = $1 AND user_id = $2`, [id, userId]);
      if (res.rowCount === 0) throw new NotFoundException('Nota no encontrada');
      return { ok: true };
    } catch (e) {
      if (e?.status) throw e;
      console.error('[NotesService] remove', e);
      throw new InternalServerErrorException('No se pudo eliminar la nota');
    }
  }
}
