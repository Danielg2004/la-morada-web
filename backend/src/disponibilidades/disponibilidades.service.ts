import { Inject, Injectable, BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DisponibilidadesService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async createBulk(psicologoId: string, fecha: string, horas: string[]) {
    if (!fecha || !Array.isArray(horas) || horas.length === 0) {
      throw new BadRequestException('Debes enviar fecha y al menos una hora.');
    }

    const clean = horas.map(h => {
      const x = (h || '').trim();
      if (/^\d{2}:\d{2}$/.test(x)) return x;
      const y = (x.length === 4 ? `0${x}` : x).slice(0,5);
      return y;
    });

    const now = new Date();
    const hoyISO = now.toISOString().slice(0,10);
    const isToday = fecha === hoyISO;

    if (fecha < hoyISO) {
      throw new BadRequestException('La fecha debe ser futura (o el mismo día en horas futuras).');
    }
    if (isToday) {
      const hh = now.getHours().toString().padStart(2,'0');
      const mm = now.getMinutes().toString().padStart(2,'0');
      const current = `${hh}:${mm}`;
      const tieneFuturas = clean.some(h => h > current);
      if (!tieneFuturas) {
        throw new BadRequestException('Debes elegir al menos una hora futura para hoy.');
      }
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const inserted: any[] = [];
      for (const h of clean) {
        if (isToday) {
          const dt = new Date(`${fecha}T${h}:00`);
          if (dt <= now) continue;
        }

        const { rows } = await client.query(
          `INSERT INTO disponibilidades (psicologo_id, fecha, hora, disponible)
           VALUES ($1, $2::date, $3::time, true)
           ON CONFLICT (psicologo_id, fecha, hora) DO NOTHING
           RETURNING id, psicologo_id, fecha, hora, disponible`,
          [psicologoId, fecha, `${h}:00`],
        );
        if (rows[0]) inserted.push(rows[0]);
      }
      await client.query('COMMIT');

      if (inserted.length === 0) {
        throw new BadRequestException('No se pudo crear ninguna disponibilidad (verifica horas futuras).');
      }
      return { inserted };
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('[DisponibilidadesService] createBulk', e);
      throw new InternalServerErrorException('No se pudo crear la disponibilidad');
    } finally {
      client.release();
    }
  }

  async listMine(psicologoId: string, from?: string, to?: string) {
    try {
      const vals: any[] = [psicologoId];
      let sql = `SELECT id, psicologo_id, fecha, to_char(hora, 'HH24:MI') AS hora, disponible
                 FROM disponibilidades
                 WHERE psicologo_id = $1`;
      if (from) { vals.push(from); sql += ` AND fecha >= $${vals.length}`; }
      if (to)   { vals.push(to);   sql += ` AND fecha <= $${vals.length}`; }
      sql += ' ORDER BY fecha ASC, hora ASC';
      const { rows } = await this.pool.query(sql, vals);
      return rows;
    } catch (e) {
      console.error('[DisponibilidadesService] listMine', e);
      throw new InternalServerErrorException('No se pudieron listar disponibilidades');
    }
  }

  async daySlots(psicologoId: string, fecha: string) {
    try {
      const { rows } = await this.pool.query(
        `SELECT id, to_char(hora, 'HH24:MI') AS hhmm
         FROM disponibilidades
         WHERE psicologo_id = $1 AND fecha = $2::date AND disponible = true
         ORDER BY hora ASC`,
        [psicologoId, fecha],
      );

      const slots = rows.map(r => ({ id: r.id, hora: r.hhmm }));

      const hoyISO = new Date().toISOString().slice(0,10);
      if (fecha === hoyISO) {
        const now = new Date();
        const current = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        return slots.filter(s => s.hora > current);
      }
      return slots;
    } catch (e) {
      console.error('[DisponibilidadesService] daySlots', e);
      throw new InternalServerErrorException('No se pudieron obtener los horarios');
    }
  }

  async remove(psicologoId: string, dispId: string) {
    try {
      const { rows } = await this.pool.query(
        `SELECT d.id, d.psicologo_id,
                EXISTS(
                  SELECT 1 FROM citas c
                  WHERE c.psicologo_id = d.psicologo_id
                    AND c.fecha = d.fecha AND c.hora = d.hora
                    AND c.estado = 'reservada'
                ) AS ocupada
         FROM disponibilidades d
         WHERE d.id = $1`,
        [dispId],
      );
      const row = rows[0];
      if (!row) throw new NotFoundException('Disponibilidad no encontrada');
      if (row.psicologo_id !== psicologoId) throw new ForbiddenException('No puedes borrar esta disponibilidad');
      if (row.ocupada) throw new BadRequestException('No puedes borrar una disponibilidad con cita reservada');

      await this.pool.query(`DELETE FROM disponibilidades WHERE id = $1`, [dispId]);
      return { ok: true };
    } catch (e) {
      if (e?.status) throw e;
      console.error('[DisponibilidadesService] remove', e);
      throw new InternalServerErrorException('No se pudo eliminar la disponibilidad');
    }
  }
}
