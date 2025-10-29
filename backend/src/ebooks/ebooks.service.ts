import { Inject, Injectable, ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateEbookDto } from './dto/create-ebook.dto';

@Injectable()
export class EbooksService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  // Crear (solo admin/psicologo)
  async create(dto: CreateEbookDto, userId: string) {
    try {
      const q = `
        INSERT INTO ebooks (titulo, imagen_url, archivo_url, descripcion, creado_por)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING id, titulo, imagen_url, archivo_url, descripcion, creado_por, creado_en
      `;
      const { rows } = await this.pool.query(q, [
        dto.titulo,
        dto.imagen_url || null,
        dto.archivo_url || null,
        dto.descripcion || null,
        userId,
      ]);
      return rows[0];
    } catch (err) {
      console.error('[EbooksService] create error:', err);
      throw new InternalServerErrorException('No se pudo crear el e-book');
    }
  }

  // Listar + búsqueda + paginación opcional
  async list(params: { q?: string; limit?: number; offset?: number; favoriteOf?: string | null }) {
    const { q, limit = 20, offset = 0, favoriteOf } = params;
    const values: any[] = [];
    const where: string[] = [];
    let idx = 1;

    if (q) {
      where.push(`(LOWER(titulo) LIKE $${idx} OR LOWER(descripcion) LIKE $${idx})`);
      values.push(`%${q.toLowerCase()}%`);
      idx++;
    }

    let base = `
      SELECT e.id, e.titulo, e.imagen_url, e.archivo_url, e.descripcion, e.creado_por, e.creado_en,
             u.nombre AS autor_nombre
        , CASE WHEN $${idx}::uuid IS NULL THEN false
               ELSE EXISTS (SELECT 1 FROM ebook_favoritos f WHERE f.user_id = $${idx} AND f.ebook_id = e.id)
          END AS es_favorito
      FROM ebooks e
      LEFT JOIN users u ON u.id = e.creado_por
    `;
    values.push(favoriteOf ?? null);
    idx++;

    if (favoriteOf) {
      where.push(`EXISTS (SELECT 1 FROM ebook_favoritos f WHERE f.user_id = $${idx} AND f.ebook_id = e.id)`);
      values.push(favoriteOf);
      idx++;
    }

    if (where.length) base += ' WHERE ' + where.join(' AND ');
    base += ` ORDER BY e.creado_en DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    values.push(limit, offset);

    try {
      const { rows } = await this.pool.query(base, values);
      return rows;
    } catch (err) {
      console.error('[EbooksService] list error:', err);
      throw new InternalServerErrorException('No se pudo listar e-books');
    }
  }

  // Detalle
  async detail(id: string, currentUserId?: string | null) {
    try {
      const { rows } = await this.pool.query(
        `
        SELECT e.id, e.titulo, e.imagen_url, e.archivo_url, e.descripcion, e.creado_por, e.creado_en,
               u.nombre AS autor_nombre,
               COALESCE(f.cnt, 0)::int AS favoritos_count,
               CASE WHEN $2::uuid IS NULL THEN false
                    ELSE EXISTS (SELECT 1 FROM ebook_favoritos ef WHERE ef.user_id = $2 AND ef.ebook_id = e.id)
               END AS es_favorito
        FROM ebooks e
        LEFT JOIN users u ON u.id = e.creado_por
        LEFT JOIN (
          SELECT ebook_id, COUNT(*)::int AS cnt
          FROM ebook_favoritos
          GROUP BY ebook_id
        ) f ON f.ebook_id = e.id
        WHERE e.id = $1
        `,
        [id, currentUserId ?? null],
      );
      if (!rows[0]) throw new NotFoundException('E-book no encontrado');
      return rows[0];
    } catch (err) {
      if (err?.status === 404) throw err;
      console.error('[EbooksService] detail error:', err);
      throw new InternalServerErrorException('No se pudo obtener el e-book');
    }
  }

  // Eliminar (solo admin/psicologo). Si quieres, valida autor; por ahora por rol se controla en el controller.
  async remove(id: string) {
    try {
      const { rowCount } = await this.pool.query(`DELETE FROM ebooks WHERE id = $1`, [id]);
      if (rowCount === 0) throw new NotFoundException('E-book no encontrado');
      return { ok: true };
    } catch (err) {
      if (err?.status === 404) throw err;
      console.error('[EbooksService] remove error:', err);
      throw new InternalServerErrorException('No se pudo eliminar el e-book');
    }
  }

  // Favoritos
  async addFavorite(ebookId: string, userId: string) {
    try {
      await this.pool.query(
        `INSERT INTO ebook_favoritos (user_id, ebook_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [userId, ebookId],
      );
      return { ok: true };
    } catch (err) {
      console.error('[EbooksService] addFavorite error:', err);
      throw new InternalServerErrorException('No se pudo marcar favorito');
    }
  }

  async removeFavorite(ebookId: string, userId: string) {
    try {
      await this.pool.query(
        `DELETE FROM ebook_favoritos WHERE user_id = $1 AND ebook_id = $2`,
        [userId, ebookId],
      );
      return { ok: true };
    } catch (err) {
      console.error('[EbooksService] removeFavorite error:', err);
      throw new InternalServerErrorException('No se pudo quitar favorito');
    }
  }
}
