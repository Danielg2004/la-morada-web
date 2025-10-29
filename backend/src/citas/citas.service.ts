import {
  Inject,
  Injectable,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class CitasService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async listPsicologos() {
    try {
      const { rows } = await this.pool.query(
        `SELECT id, nombre, apellidos
         FROM users
         WHERE rol = 'psicologo'
         ORDER BY nombre ASC`,
      );
      return rows.map((r) => ({
        id: r.id,
        nombre: `${r.nombre} ${r.apellidos}`.trim(),
      }));
    } catch (e) {
      console.error('[CitasService] listPsicologos', e);
      throw new InternalServerErrorException('No se pudieron listar psicólogos');
    }
  }

  async reservar(
    pacienteId: string,
    psicologoId: string,
    fecha: string,
    hora: string,
  ) {
    if (!psicologoId || !fecha || !hora)
      throw new BadRequestException('Faltan datos');

    const hhmm = /^\d{2}:\d{2}:\d{2}$/.test(hora) ? hora.slice(0, 5) : hora.slice(0, 5);
    const target = new Date(`${fecha}T${hhmm}:00`);
    const now = new Date();
    if (target <= now) {
      throw new BadRequestException('Solo puedes reservar citas a futuro.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const dispQ = await client.query(
        `SELECT id, disponible
         FROM disponibilidades
         WHERE psicologo_id = $1 AND fecha = $2::date AND hora = $3::time
         LIMIT 1`,
        [psicologoId, fecha, `${hhmm}:00`],
      );
      const disp = dispQ.rows[0];
      if (!disp)
        throw new BadRequestException('No hay disponibilidad para ese día y hora');
      if (!disp.disponible)
        throw new BadRequestException('La hora ya fue reservada');

      const citaQ = await client.query(
        `INSERT INTO citas (psicologo_id, paciente_id, fecha, hora, estado)
         VALUES ($1, $2, $3::date, $4::time, 'reservada')
         RETURNING id, psicologo_id, paciente_id, fecha, to_char(hora,'HH24:MI') as hora, estado, creado_en`,
        [psicologoId, pacienteId, fecha, `${hhmm}:00`],
      );

      await client.query(
        `UPDATE disponibilidades SET disponible = false WHERE id = $1`,
        [disp.id],
      );

      await client.query('COMMIT');
      return citaQ.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      if (e?.status) throw e;
      console.error('[CitasService] reservar', e);
      throw new InternalServerErrorException('No se pudo crear la cita');
    } finally {
      client.release();
    }
  }

  async listMine(userId: string, rol: string) {
    try {
      let sql = `
        SELECT c.id, c.psicologo_id, c.paciente_id, c.fecha,
               to_char(c.hora, 'HH24:MI') AS hora, c.estado, c.creado_en,
               p.nombre AS psicologo_nombre, p.apellidos AS psicologo_apellidos,
               u.nombre AS paciente_nombre, u.apellidos AS paciente_apellidos
        FROM citas c
        LEFT JOIN users p ON p.id = c.psicologo_id
        LEFT JOIN users u ON u.id = c.paciente_id
      `;
      const vals: any[] = [];
      if (rol === 'paciente') {
        sql += ` WHERE c.paciente_id = $1`;
        vals.push(userId);
      } else if (rol === 'psicologo') {
        sql += ` WHERE c.psicologo_id = $1`;
        vals.push(userId);
      } else {
        sql += ` WHERE 1=1`;
      }
      sql += ` ORDER BY c.fecha ASC, c.hora ASC`;
      const { rows } = await this.pool.query(sql, vals);
      return rows;
    } catch (e) {
      console.error('[CitasService] listMine', e);
      throw new InternalServerErrorException('No se pudieron listar las citas');
    }
  }

  // ✅ completar: devuelve la cita ACTUALIZADA para refrescar UI
  async completar(userId: string, rol: string, citaId: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `SELECT id, psicologo_id, paciente_id, fecha, hora, estado
         FROM citas
         WHERE id = $1`,
        [citaId],
      );
      const c = rows[0];
      if (!c) throw new NotFoundException('Cita no encontrada');

      const autorizado = rol === 'admin' || c.psicologo_id === userId;
      if (!autorizado)
        throw new ForbiddenException('No puedes completar esta cita');

      if (c.estado !== 'reservada') {
        throw new BadRequestException(
          'Solo puedes marcar como realizada una cita reservada',
        );
      }

      const upd = await client.query(
        `UPDATE citas SET estado = 'completada' WHERE id = $1
         RETURNING id, psicologo_id, paciente_id, fecha,
                   to_char(hora,'HH24:MI') as hora, estado, creado_en`,
        [citaId],
      );

      // traer nombres para no requerir reload
      const names = await client.query(
        `SELECT
            u1.nombre  AS psicologo_nombre,
            u1.apellidos AS psicologo_apellidos,
            u2.nombre  AS paciente_nombre,
            u2.apellidos AS paciente_apellidos
         FROM users u1
         LEFT JOIN users u2 ON u2.id = $2
         WHERE u1.id = $1
         LIMIT 1`,
        [upd.rows[0].psicologo_id, upd.rows[0].paciente_id],
      );

      await client.query('COMMIT');
      return { ...upd.rows[0], ...(names.rows[0] || {}) };
    } catch (e) {
      await client.query('ROLLBACK');
      if (e?.status) throw e;
      console.error('[CitasService] completar', e);
      throw new InternalServerErrorException('No se pudo completar la cita');
    } finally {
      client.release();
    }
  }

  async cancelar(userId: string, rol: string, citaId: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT id, psicologo_id, paciente_id, fecha, hora, estado
         FROM citas
         WHERE id = $1`,
        [citaId],
      );
      const c = rows[0];
      if (!c) throw new NotFoundException('Cita no encontrada');

      const authorized =
        rol === 'admin' || c.paciente_id === userId || c.psicologo_id === userId;
      if (!authorized) throw new ForbiddenException('No puedes cancelar esta cita');

      if (c.estado !== 'reservada')
        throw new BadRequestException('Solo puedes cancelar citas reservadas');

      await client.query(
        `UPDATE citas SET estado = 'cancelada' WHERE id = $1`,
        [c.id],
      );

      await client.query(
        `UPDATE disponibilidades
         SET disponible = true
         WHERE psicologo_id = $1 AND fecha = $2 AND hora = $3`,
        [c.psicologo_id, c.fecha, c.hora],
      );

      await client.query('COMMIT');
      return { ok: true };
    } catch (e) {
      await client.query('ROLLBACK');
      if (e?.status) throw e;
      console.error('[CitasService] cancelar', e);
      throw new InternalServerErrorException('No se pudo cancelar la cita');
    } finally {
      client.release();
    }
  }
}
