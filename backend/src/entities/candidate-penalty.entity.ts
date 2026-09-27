import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Candidate } from './candidate.entity';

@Entity('candidate_penalties')
export class CandidatePenalty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => Candidate, (c) => c.penalties, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  /** Valor subtraído da nota (0,5–10, passos de 0,5). */
  @Column({ type: 'double precision' })
  amount: number;

  @Column({ type: 'varchar', length: 500 })
  reason: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
