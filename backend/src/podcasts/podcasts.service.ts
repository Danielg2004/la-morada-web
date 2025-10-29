import { Inject, Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreatePodcastDto } from './dto/create-podcast.dto';

@Injectable()
export class PodcastsService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async list(q?: string, limit = 20, offset = 0, userId?: string) {
    const vals: any[] = [];
    let sql = `
      SELECT p.id, p.titulo, p.descripcion, p.embed_url, p.creado_por, p.creado_en,
             u.nombre AS autor_nombre,
             CASE WHEN $1::uuid IS NULL THEN false
                  ELSE EXISTS(SELECT 1 FROM podcast_favoritos f WHERE f.user_id = $1 AND f.podcast_id = p.id)
             END AS es_favorito
      FROM podcasts p
      LEFT JOIN users u ON u.id = p.creado_por
    `;
    vals.push(userId || null);

    if (q) {
      sql += ` WHERE (LOWER(p.titulo) LIKE $2 OR LOWER(p.descripcion) LIKE $2) `;
      vals.push(`%${q.toLowerCase()}%`);
    }
    sql += ` ORDER BY p.creado_en DESC LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`;
    vals.push(limit, offset);

    try {
      const { rows } = await this.pool.query(sql, vals);
      return rows;
    } catch (e) {
      console.error('[PodcastsService] list', e);
      throw new InternalServerErrorException('No se pudieron listar los podcasts');
    }
  }

  async detail(id: string, userId?: string) {
    try {
      const { rows } = await this.pool.query(
        `SELECT p.id, p.titulo, p.descripcion, p.embed_url, p.creado_por, p.creado_en,
                u.nombre AS autor_nombre,
                CASE WHEN $2::uuid IS NULL THEN false
                     ELSE EXISTS(SELECT 1 FROM podcast_favoritos f WHERE f.user_id = $2 AND f.podcast_id = p.id)
                END AS es_favorito,
                coalesce((SELECT segundos FROM podcast_progreso pr WHERE pr.user_id = $2 AND pr.podcast_id = p.id),0) AS progreso
         FROM podcasts p
         LEFT JOIN users u ON u.id = p.creado_por
         WHERE p.id = $1`,
        [id, userId || null],
      );
      if (!rows[0]) throw new NotFoundException('Podcast no encontrado');
      return rows[0];
    } catch (e) {
      if (e?.status === 404) throw e;
      console.error('[PodcastsService] detail', e);
      throw new InternalServerErrorException('No se pudo obtener el podcast');
    }
  }

  async create(dto: CreatePodcastDto, creadorId: string) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO podcasts (titulo, descripcion, embed_url, creado_por)
         VALUES ($1,$2,$3,$4)
         RETURNING id, titulo, descripcion, embed_url, creado_por, creado_en`,
        [dto.titulo, dto.descripcion || '', dto.embed_url, creadorId],
      );
      return rows[0];
    } catch (e) {
      console.error('[PodcastsService] create', e);
      throw new InternalServerErrorException('No se pudo crear el podcast');
    }
  }

  async remove(id: string, requesterId: string, requesterRol: string) {
    try {
      const { rows } = await this.pool.query(`SELECT creado_por FROM podcasts WHERE id = $1`, [id]);
      if (!rows[0]) throw new NotFoundException('Podcast no encontrado');

      const esAutor = rows[0].creado_por === requesterId;
      const puede = requesterRol === 'admin' || requesterRol === 'psicologo' || esAutor;
      if (!puede) throw new ForbiddenException('No autorizado');

      const res = await this.pool.query(`DELETE FROM podcasts WHERE id = $1`, [id]);
      if (res.rowCount === 0) throw new NotFoundException('Podcast no encontrado');
      return { ok: true };
    } catch (e) {
      if (e?.status) throw e;
      console.error('[PodcastsService] remove', e);
      throw new InternalServerErrorException('No se pudo eliminar el podcast');
    }
  }

  async addFavorite(id: string, userId: string) {
    try {
      await this.pool.query(
        `INSERT INTO podcast_favoritos (user_id, podcast_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [userId, id],
      );
      return { ok: true };
    } catch (e) {
      console.error('[PodcastsService] addFavorite', e);
      throw new InternalServerErrorException('No se pudo marcar favorito');
    }
  }

  async removeFavorite(id: string, userId: string) {
    try {
      await this.pool.query(`DELETE FROM podcast_favoritos WHERE user_id = $1 AND podcast_id = $2`, [userId, id]);
      return { ok: true };
    } catch (e) {
      console.error('[PodcastsService] removeFavorite', e);
      throw new InternalServerErrorException('No se pudo quitar favorito');
    }
  }

  async myFavorites(userId: string, q?: string) {
    try {
      const vals: any[] = [userId];
      let sql = `
        SELECT p.id, p.titulo, p.descripcion, p.embed_url, p.creado_por, p.creado_en,
               u.nombre AS autor_nombre, true AS es_favorito
        FROM podcast_favoritos f
        JOIN podcasts p ON p.id = f.podcast_id
        LEFT JOIN users u ON u.id = p.creado_por
        WHERE f.user_id = $1
      `;
      if (q) {
        sql += ` AND (LOWER(p.titulo) LIKE $2 OR LOWER(p.descripcion) LIKE $2) `;
        vals.push(`%${q.toLowerCase()}%`);
      }
      sql += ` ORDER BY p.creado_en DESC`;
      const { rows } = await this.pool.query(sql, vals);
      return rows;
    } catch (e) {
      console.error('[PodcastsService] myFavorites', e);
      throw new InternalServerErrorException('No se pudieron listar favoritos');
    }
  }

  async getProgress(id: string, userId: string) {
    try {
      const { rows } = await this.pool.query(
        `SELECT segundos FROM podcast_progreso WHERE user_id = $1 AND podcast_id = $2`,
        [userId, id],
      );
      return { segundos: rows[0]?.segundos ?? 0 };
    } catch (e) {
      console.error('[PodcastsService] getProgress', e);
      throw new InternalServerErrorException('No se pudo obtener el progreso');
    }
  }

  async setProgress(id: string, userId: string, segundos: number) {
    try {
      await this.pool.query(
        `INSERT INTO podcast_progreso (user_id, podcast_id, segundos, actualizado_en)
         VALUES ($1,$2,$3, NOW())
         ON CONFLICT (user_id, podcast_id)
         DO UPDATE SET segundos = EXCLUDED.segundos, actualizado_en = NOW()`,
        [userId, id, Number(segundos) || 0],
      );
      return { ok: true };
    } catch (e) {
      console.error('[PodcastsService] setProgress', e);
      throw new InternalServerErrorException('No se pudo guardar el progreso');
    }
  }
}
