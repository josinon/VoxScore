import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Candidate } from './candidate.entity';
import { User } from './user.entity';

@Entity('votes')
@Unique('UQ_votes_user_candidate', ['user', 'candidate'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Candidate, (candidate) => candidate.votes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  /** Critério → nota 1–10 (validação de negócio nas fases seguintes) */
  @Column({ type: 'jsonb' })
  criteriaScores: Record<string, number>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
