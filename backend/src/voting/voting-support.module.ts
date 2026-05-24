import { Module } from '@nestjs/common';
import { VoteCandidateCacheService } from './vote-candidate-cache.service';

/** Cache partilhado do caminho de voto (sem dependência de CandidatesModule). */
@Module({
  providers: [VoteCandidateCacheService],
  exports: [VoteCandidateCacheService],
})
export class VotingSupportModule {}
