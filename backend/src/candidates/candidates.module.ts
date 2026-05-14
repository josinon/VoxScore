import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Candidate } from '../entities/candidate.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';

@Module({
  imports: [TypeOrmModule.forFeature([Candidate]), AuthModule],
  controllers: [CandidatesController],
  providers: [CandidatesService, RolesGuard],
})
export class CandidatesModule {}
