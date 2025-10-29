import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EbooksModule } from './ebooks/ebooks.module';
import { BlogModule } from './blog/blog.module';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    EbooksModule,
    BlogModule,  // <- nuevo
    NotesModule, // <- nuevo
  ],
})
export class AppModule {}
