import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Candidate } from '../entities/candidate.entity';
import { Vote } from '../entities/vote.entity';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';

@Module({
  imports: [TypeOrmModule.forFeature([Candidate, Vote]), AuthModule],
  controllers: [RankingController],
  providers: [RankingService],
})
export class RankingModule {}
