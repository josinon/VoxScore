import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CandidatesModule } from '../candidates/candidates.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { Candidate } from '../entities/candidate.entity';
import { User } from '../entities/user.entity';
import { Vote } from '../entities/vote.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { VotingController } from './voting.controller';
import { VotingService } from './voting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, Candidate, User]),
    AuthModule,
    CandidatesModule,
    RealtimeModule,
  ],
  controllers: [VotingController],
  providers: [VotingService, RolesGuard],
})
export class VotingModule {}
