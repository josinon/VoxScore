import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CandidatesModule } from '../candidates/candidates.module';
import { RankingModule } from '../ranking/ranking.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { Candidate } from '../entities/candidate.entity';
import { Vote } from '../entities/vote.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { VotingController } from './voting.controller';
import { VotingService } from './voting.service';
import { VotingSupportModule } from './voting-support.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, Candidate]),
    VotingSupportModule,
    AuthModule,
    CandidatesModule,
    RankingModule,
    RealtimeModule,
  ],
  controllers: [VotingController],
  providers: [VotingService, RolesGuard],
})
export class VotingModule {}
