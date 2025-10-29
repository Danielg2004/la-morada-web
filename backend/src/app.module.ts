import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EbooksModule } from './ebooks/ebooks.module';
import { BlogModule } from './blog/blog.module';
import { NotesModule } from './notes/notes.module';
import { PodcastsModule } from './podcasts/podcasts.module';
import { DisponibilidadesModule } from './disponibilidades/disponibilidades.module';
import { CitasModule } from './citas/citas.module';
import { ProfileModule } from './profile/profile.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    EbooksModule,
    BlogModule,  // <- nuevo
    NotesModule,
    PodcastsModule, // <- nuevo
    DisponibilidadesModule,
    CitasModule,
    ProfileModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
  ],
})
export class AppModule {}
