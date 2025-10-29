import { Inject, Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateBlogDto } from './dto/create-blog.dto';

@Injectable()
export class BlogService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async list(q?: string, limit = 20, offset = 0) {
    const vals: any[] = [];
    let sql = `
      SELECT b.id, b.titulo, b.contenido, b.autor_id, b.creado_en, u.nombre AS autor_nombre
      FROM blog_posts b
      LEFT JOIN users u ON u.id = b.autor_id
    `;
    if (q) {
      sql += ` WHERE (LOWER(b.titulo) LIKE $1 OR LOWER(b.contenido) LIKE $1) `;
      vals.push(`%${q.toLowerCase()}%`);
    }
    sql += ` ORDER BY b.creado_en DESC LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`;
    vals.push(limit, offset);

    try {
      const { rows } = await this.pool.query(sql, vals);
      return rows;
    } catch (e) {
      console.error('[BlogService] list', e);
      throw new InternalServerErrorException('No se pudo listar el blog');
    }
  }

  async detail(id: string) {
    try {
      const { rows } = await this.pool.query(
        `SELECT b.id, b.titulo, b.contenido, b.autor_id, b.creado_en, u.nombre AS autor_nombre
         FROM blog_posts b
         LEFT JOIN users u ON u.id = b.autor_id
         WHERE b.id = $1`,
        [id],
      );
      if (!rows[0]) throw new NotFoundException('Entrada no encontrada');
      return rows[0];
    } catch (e) {
      if (e?.status === 404) throw e;
      console.error('[BlogService] detail', e);
      throw new InternalServerErrorException('No se pudo obtener la entrada');
    }
  }

  async create(dto: CreateBlogDto, autorId: string) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO blog_posts (titulo, contenido, autor_id)
         VALUES ($1,$2,$3)
         RETURNING id, titulo, contenido, autor_id, creado_en`,
        [dto.titulo, dto.contenido, autorId],
      );
      return rows[0];
    } catch (e) {
      console.error('[BlogService] create', e);
      throw new InternalServerErrorException('No se pudo crear la entrada');
    }
  }

  async remove(id: string, requesterId: string, requesterRol: string) {
    // Permitir eliminar a admin/psicologo; (opcional) también al autor
    try {
      const { rows } = await this.pool.query(`SELECT autor_id FROM blog_posts WHERE id = $1`, [id]);
      if (!rows[0]) throw new NotFoundException('Entrada no encontrada');

      const esAutor = rows[0].autor_id === requesterId;
      const puede = requesterRol === 'admin' || requesterRol === 'psicologo' || esAutor;
      if (!puede) throw new ForbiddenException('No autorizado');

      const res = await this.pool.query(`DELETE FROM blog_posts WHERE id = $1`, [id]);
      if (res.rowCount === 0) throw new NotFoundException('Entrada no encontrada');
      return { ok: true };
    } catch (e) {
      if (e?.status) throw e;
      console.error('[BlogService] remove', e);
      throw new InternalServerErrorException('No se pudo eliminar la entrada');
    }
  }
}
