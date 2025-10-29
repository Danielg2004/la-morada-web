import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profile')
export class ProfileController {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  // Resumen por rol (paciente, psicologo, admin)
  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async summary(@Req() req: any) {
    const userId: string = req.user.userId;
    const rol: string = req.user.rol;

    // Info básica del usuario
    const userQ = await this.pool.query(
      `SELECT id, nombre, segundo_nombre, apellidos, correo, rol, creado_en
       FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );
    const me = userQ.rows[0];

    // Utilidades de tiempo (hoy y ahora) para filtros
    // SQL evaluará: futuras = (fecha > today) OR (fecha = today AND hora > now)
    const basePaciente = `
      SELECT
        COUNT(*) FILTER (WHERE estado='reservada')   AS reservadas,
        COUNT(*) FILTER (WHERE estado='completada')  AS completadas,
        COUNT(*) FILTER (WHERE estado='cancelada')   AS canceladas,
        COUNT(*)                                     AS total,
        COUNT(*) FILTER (
          WHERE (fecha > CURRENT_DATE)
             OR (fecha = CURRENT_DATE AND hora > CURRENT_TIME)
        ) AS proximas
      FROM citas
      WHERE paciente_id = $1
    `;

    const basePsico = `
      SELECT
        COUNT(*) FILTER (WHERE estado='reservada')   AS reservadas,
        COUNT(*) FILTER (WHERE estado='completada')  AS completadas,
        COUNT(*) FILTER (WHERE estado='cancelada')   AS canceladas,
        COUNT(*)                                     AS total,
        COUNT(*) FILTER (
          WHERE (fecha > CURRENT_DATE)
             OR (fecha = CURRENT_DATE AND hora > CURRENT_TIME)
        ) AS proximas
      FROM citas
      WHERE psicologo_id = $1
    `;

    const baseAdmin = `
      SELECT
        COUNT(*) FILTER (WHERE estado='reservada')   AS reservadas,
        COUNT(*) FILTER (WHERE estado='completada')  AS completadas,
        COUNT(*) FILTER (WHERE estado='cancelada')   AS canceladas,
        COUNT(*)                                     AS total,
        COUNT(*) FILTER (
          WHERE (fecha > CURRENT_DATE)
             OR (fecha = CURRENT_DATE AND hora > CURRENT_TIME)
        ) AS proximas
      FROM citas
    `;

    if (rol === 'paciente') {
      const citas = (await this.pool.query(basePaciente, [userId])).rows[0];

      // Favoritos/actividad ligera
      const favEbooks = await this.pool.query(
        `SELECT COUNT(*)::int AS n FROM ebook_favoritos WHERE user_id = $1`,
        [userId],
      );
      const favPods = await this.pool.query(
        `SELECT COUNT(*)::int AS n FROM podcast_favoritos WHERE user_id = $1`,
        [userId],
      );
      const notas = await this.pool.query(
        `SELECT COUNT(*)::int AS n FROM private_notes WHERE user_id = $1`,
        [userId],
      );

      return {
        me,
        rol,
        widgets: {
          citas,
          favoritos: {
            ebooks: favEbooks.rows[0]?.n ?? 0,
            podcasts: favPods.rows[0]?.n ?? 0,
          },
          notas: notas.rows[0]?.n ?? 0,
        },
        quickActions: [
          { label: 'Agendar cita', path: '/citas' },
          { label: 'Explorar e-books', path: '/ebooks' },
          { label: 'Podcasts', path: '/podcasts' },
          { label: 'Mi diario', path: '/notas' },
        ],
      };
    }

    if (rol === 'psicologo') {
      const citas = (await this.pool.query(basePsico, [userId])).rows[0];

      const disp = await this.pool.query(
        `SELECT COUNT(*)::int AS n
         FROM disponibilidades
         WHERE psicologo_id = $1
           AND disponible = true
           AND (fecha > CURRENT_DATE OR (fecha = CURRENT_DATE AND hora > CURRENT_TIME))`,
        [userId],
      );

      const ebooks = await this.pool.query(
        `SELECT COUNT(*)::int AS n FROM ebooks WHERE creado_por = $1`,
        [userId],
      );
      const posts = await this.pool.query(
        `SELECT COUNT(*)::int AS n FROM blog_posts WHERE autor_id = $1`,
        [userId],
      );
      const pods = await this.pool.query(
        `SELECT COUNT(*)::int AS n FROM podcasts WHERE creado_por = $1`,
        [userId],
      );

      return {
        me,
        rol,
        widgets: {
          citas,
          disponibilidades_futuras: disp.rows[0]?.n ?? 0,
          contenidos_publicados: {
            ebooks: ebooks.rows[0]?.n ?? 0,
            posts: posts.rows[0]?.n ?? 0,
            podcasts: pods.rows[0]?.n ?? 0,
          },
        },
        quickActions: [
          { label: 'Crear disponibilidad', path: '/disponibilidad' },
          { label: 'Mis citas', path: '/citas' },
          { label: 'Subir e-book', path: '/ebooks/admin' },
          { label: 'Crear post', path: '/blog/admin' },
          { label: 'Subir podcast', path: '/podcasts/admin' },
        ],
      };
    }

    // admin
    if (rol === 'admin') {
      const citas = (await this.pool.query(baseAdmin)).rows[0];
      const users = await this.pool.query(
        `SELECT
            COUNT(*)::int                                       AS total,
            COUNT(*) FILTER (WHERE rol='paciente')::int        AS pacientes,
            COUNT(*) FILTER (WHERE rol='psicologo')::int       AS psicologos,
            COUNT(*) FILTER (WHERE rol='admin')::int           AS admins
         FROM users`,
      );
      const ebooks = await this.pool.query(`SELECT COUNT(*)::int AS n FROM ebooks`);
      const posts  = await this.pool.query(`SELECT COUNT(*)::int AS n FROM blog_posts`);
      const pods   = await this.pool.query(`SELECT COUNT(*)::int AS n FROM podcasts`);

      return {
        me,
        rol,
        widgets: {
          citas,
          usuarios: users.rows[0],
          contenidos: {
            ebooks: ebooks.rows[0]?.n ?? 0,
            posts: posts.rows[0]?.n ?? 0,
            podcasts: pods.rows[0]?.n ?? 0,
          },
        },
        quickActions: [
          { label: 'Panel de citas', path: '/citas' },
          { label: 'E-books', path: '/ebooks' },
          { label: 'Blog', path: '/blog' },
          { label: 'Podcasts', path: '/podcasts' },
        ],
      };
    }

    // fallback (no debería ocurrir)
    return { me, rol, widgets: {}, quickActions: [] };
  }
}
