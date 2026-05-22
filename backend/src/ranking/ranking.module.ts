import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Candidate } from '../entities/candidate.entity';
import { EventSettings } from '../entities/event-settings.entity';
import { Vote } from '../entities/vote.entity';
import { RealtimeModule } from '../realtime/realtime.module';
import { EventSettingsService } from './event-settings.service';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, Vote, EventSettings]),
    AuthModule,
    RealtimeModule,
  ],
  controllers: [RankingController],
  providers: [RankingService, EventSettingsService],
})
export class RankingModule {}
