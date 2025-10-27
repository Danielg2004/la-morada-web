import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  providers: [
    {
      provide: 'PG_POOL',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Parseamos manualmente la DATABASE_URL en vez de dársela directo al Pool
        // Ej:
        // postgresql://postgres:PASS@db.xxx.supabase.co:6543/postgres?sslmode=require

        const url = config.get<string>('DATABASE_URL');
        if (!url) {
          throw new Error('DATABASE_URL no está definido en .env');
        }

        console.log('[DB] Usando DATABASE_URL:', url);

        // Usamos URL estándar de Node para extraer campos
        const parsed = new URL(url);

        const host = parsed.hostname;              // db.owtgmkpdxncyxayqxisu.supabase.co
        const port = Number(parsed.port) || 5432;  // 6543
        const user = parsed.username;              // postgres
        const password = parsed.password;          // tu pass
        const database = parsed.pathname.replace('/', ''); // 'postgres'

        // Creamos pool con campos sueltos + ssl forzado permisivo
        return new Pool({
          host,
          port,
          user,
          password,
          database,
          max: 10,
          ssl: {
            rejectUnauthorized: false,
          },
        });
      },
    },
  ],
  exports: ['PG_POOL'],
})
export class DatabaseModule {}
