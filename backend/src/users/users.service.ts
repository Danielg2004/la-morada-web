import { Inject, Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async createPaciente(dto: any) {
    // Validaciones básicas:
    if (!dto.nombre || !dto.apellidos) {
      throw new BadRequestException('Nombre y apellidos son obligatorios');
    }
    if (Number(dto.edad) < 18) {
      throw new BadRequestException('Debes ser mayor de edad (18+)');
    }
    if (!dto.cedula || dto.cedula.length < 6) {
      throw new BadRequestException('La cédula debe tener al menos 6 caracteres');
    }
    if (!dto.correo) {
      throw new BadRequestException('El correo es obligatorio');
    }
    if (!dto.password) {
      throw new BadRequestException('La contraseña es obligatoria');
    }
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // ¿Existe ya alguien con ese correo o cédula?
    try {
      const dupCheck = await this.pool.query(
        `SELECT id FROM users WHERE correo = $1 OR cedula = $2 LIMIT 1`,
        [dto.correo, dto.cedula],
      );
      if (dupCheck.rows.length > 0) {
        throw new BadRequestException('Ya existe un usuario con ese correo o cédula');
      }
    } catch (err) {
      console.error('[UsersService] Error revisando duplicados:', err);
      throw new InternalServerErrorException('Error interno al validar usuario');
    }

    // Hashear password
    let hash: string;
    try {
      hash = await bcrypt.hash(dto.password, 10);
    } catch (err) {
      console.error('[UsersService] Error hasheando password:', err);
      throw new InternalServerErrorException('Error interno al procesar contraseña');
    }

    // Insertar en la tabla users
    try {
      const insert = `
        INSERT INTO users (
          nombre,
          segundo_nombre,
          apellidos,
          edad,
          cedula,
          correo,
          password_hash,
          rol
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,'paciente')
        RETURNING id, nombre, correo, rol, creado_en
      `;

      const values = [
        dto.nombre,
        dto.segundo_nombre || null,
        dto.apellidos,
        dto.edad,
        dto.cedula,
        dto.correo,
        hash,
      ];

      const result = await this.pool.query(insert, values);
      return result.rows[0];
    } catch (err) {
      console.error('[UsersService] Error insertando usuario:', err);
      throw new InternalServerErrorException('Error interno al crear usuario');
    }
  }

  async findByCorreoOCedula(identifier: string) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM users WHERE correo = $1 OR cedula = $1 LIMIT 1`,
        [identifier],
      );
      return result.rows[0] || null;
    } catch (err) {
      console.error('[UsersService] Error buscando usuario por correo/cedula:', err);
      throw new InternalServerErrorException('Error interno al buscar usuario');
    }
  }
}
