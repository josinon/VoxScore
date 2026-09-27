import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RankingModule } from '../ranking/ranking.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { VotingSupportModule } from '../voting/voting-support.module';
import { Candidate } from '../entities/candidate.entity';
import { CandidatePenalty } from '../entities/candidate-penalty.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, CandidatePenalty]),
    AuthModule,
    RankingModule,
    RealtimeModule,
    VotingSupportModule,
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService, RolesGuard],
  exports: [CandidatesService],
})
export class CandidatesModule {}
