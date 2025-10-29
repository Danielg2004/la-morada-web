import { Inject, Injectable, BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';

export interface CreateEbookDto {
  titulo: string;
  imagen_url?: string | null;
  archivo_url?: string | null;
  descripcion?: string | null;
  price?: number; // <- nuevo
}

@Injectable()
export class EbooksService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  // Listado con filtros básicos (q: búsqueda y favs del usuario autenticado)
  async list(userId: string | null, q?: string) {
    try {
      const params: any[] = [];
      let where = '1=1';
      if (q && q.trim()) {
        params.push(`%${q.trim()}%`);
        where += ` AND (LOWER(e.titulo) LIKE LOWER($${params.length}) OR LOWER(e.descripcion) LIKE LOWER($${params.length}))`;
      }

      const favSelect = userId
        ? `EXISTS(SELECT 1 FROM ebook_favoritos f WHERE f.user_id = $${params.push(userId)} AND f.ebook_id = e.id) AS es_favorito,`
        : `false AS es_favorito,`;

      const sql = `
        SELECT
          e.id,
          e.titulo,
          e.imagen_url,
          e.archivo_url,
          e.descripcion,
          e.price, -- <- nuevo
          ${favSelect}
          e.creado_en,
          u.nombre AS autor_nombre,
          u.apellidos AS autor_apellidos
        FROM ebooks e
        LEFT JOIN users u ON u.id = e.creado_por
        WHERE ${where}
        ORDER BY e.creado_en DESC
      `;
      const { rows } = await this.pool.query(sql, params);
      return rows;
    } catch (e) {
      console.error('[EbooksService] list', e);
      throw new InternalServerErrorException('No se pudieron listar e-books');
    }
  }

  async listMyFavorites(userId: string, q?: string) {
    try {
      const params: any[] = [userId];
      let and = '';
      if (q && q.trim()) {
        params.push(`%${q.trim()}%`);
        and = ` AND (LOWER(e.titulo) LIKE LOWER($${params.length}) OR LOWER(e.descripcion) LIKE LOWER($${params.length}))`;
      }

      const { rows } = await this.pool.query(
        `
        SELECT
          e.id, e.titulo, e.imagen_url, e.archivo_url, e.descripcion, e.price,
          true AS es_favorito,
          e.creado_en
        FROM ebook_favoritos f
        JOIN ebooks e ON e.id = f.ebook_id
        WHERE f.user_id = $1 ${and}
        ORDER BY e.creado_en DESC
        `,
        params,
      );
      return rows;
    } catch (e) {
      console.error('[EbooksService] listMyFavorites', e);
      throw new InternalServerErrorException('No se pudieron listar favoritos');
    }
  }

  async detail(userId: string | null, id: string) {
    try {
      const params: any[] = [id];
      const favSelect = userId
        ? `EXISTS(SELECT 1 FROM ebook_favoritos f WHERE f.user_id = $${params.push(userId)} AND f.ebook_id = e.id) AS es_favorito,`
        : `false AS es_favorito,`;
      const { rows } = await this.pool.query(
        `
        SELECT
          e.id, e.titulo, e.imagen_url, e.archivo_url, e.descripcion, e.price,
          ${favSelect}
          e.creado_en,
          u.nombre AS autor_nombre,
          u.apellidos AS autor_apellidos,
          e.creado_por
        FROM ebooks e
        LEFT JOIN users u ON u.id = e.creado_por
        WHERE e.id = $1
        LIMIT 1
        `,
        params,
      );
      const ebook = rows[0];
      if (!ebook) throw new NotFoundException('E-book no encontrado');
      return ebook;
    } catch (e) {
      if (e?.status) throw e;
      console.error('[EbooksService] detail', e);
      throw new InternalServerErrorException('No se pudo obtener el e-book');
    }
  }

  // Nuevo: verificar acceso (compra) del usuario a un ebook
  async hasAccess(userId: string, ebookId: string) {
    try {
      const q = await this.pool.query(
        `SELECT 1 FROM ebook_purchases WHERE user_id = $1 AND ebook_id = $2 LIMIT 1`,
        [userId, ebookId],
      );
      return q.rows.length > 0;
    } catch (e) {
      console.error('[EbooksService] hasAccess', e);
      throw new InternalServerErrorException('No se pudo verificar acceso');
    }
  }

  async create(creator: { id: string; rol: string }, dto: CreateEbookDto) {
    if (!(creator.rol === 'admin' || creator.rol === 'psicologo')) {
      throw new ForbiddenException('No autorizado para crear e-books');
    }
    if (!dto.titulo || !dto.titulo.trim()) {
      throw new BadRequestException('El título es obligatorio');
    }
    const price = dto.price == null ? 0 : Number(dto.price);
    if (Number.isNaN(price) || price < 0) {
      throw new BadRequestException('Precio inválido');
    }

    try {
      const { rows } = await this.pool.query(
        `
        INSERT INTO ebooks (titulo, imagen_url, archivo_url, descripcion, price, creado_por)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING id, titulo, imagen_url, archivo_url, descripcion, price, creado_en
        `,
        [
          dto.titulo.trim(),
          dto.imagen_url || null,
          dto.archivo_url || null,
          dto.descripcion || null,
          price,
          creator.id,
        ],
      );
      return rows[0];
    } catch (e) {
      console.error('[EbooksService] create', e);
      throw new InternalServerErrorException('No se pudo crear el e-book');
    }
  }

  async remove(requester: { id: string; rol: string }, id: string) {
    try {
      // solo admin/psicólogo autor o admin global
      const { rows } = await this.pool.query(
        `SELECT creado_por FROM ebooks WHERE id = $1`,
        [id],
      );
      const found = rows[0];
      if (!found) throw new NotFoundException('E-book no encontrado');

      if (!(requester.rol === 'admin' || found.creado_por === requester.id)) {
        throw new ForbiddenException('No autorizado para eliminar');
      }

      await this.pool.query(`DELETE FROM ebooks WHERE id = $1`, [id]);
      return { ok: true };
    } catch (e) {
      if (e?.status) throw e;
      console.error('[EbooksService] remove', e);
      throw new InternalServerErrorException('No se pudo eliminar el e-book');
    }
  }

  async addFavorite(userId: string, ebookId: string) {
    try {
      await this.pool.query(
        `
        INSERT INTO ebook_favoritos (user_id, ebook_id)
        VALUES ($1,$2)
        ON CONFLICT (user_id, ebook_id) DO NOTHING
        `,
        [userId, ebookId],
      );
      return { ok: true };
    } catch (e) {
      console.error('[EbooksService] addFavorite', e);
      throw new InternalServerErrorException('No se pudo agregar a favoritos');
    }
  }

  async removeFavorite(userId: string, ebookId: string) {
    try {
      await this.pool.query(
        `DELETE FROM ebook_favoritos WHERE user_id = $1 AND ebook_id = $2`,
        [userId, ebookId],
      );
      return { ok: true };
    } catch (e) {
      console.error('[EbooksService] removeFavorite', e);
      throw new InternalServerErrorException('No se pudo quitar de favoritos');
    }
  }
}
