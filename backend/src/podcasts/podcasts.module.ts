import { Module } from '@nestjs/common';
import { PodcastsService } from './podcasts.service';
import { PodcastsController } from './podcasts.controller';

@Module({
  controllers: [PodcastsController],
  providers: [PodcastsService],
})
export class PodcastsModule {}
