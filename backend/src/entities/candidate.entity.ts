import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vote } from './vote.entity';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  musicTitle: string;

  @Column({ type: 'varchar', length: 120 })
  genre: string;

  @Column({ type: 'text' })
  bio: string;

  @Column({ type: 'varchar', length: 2048 })
  photoUrl: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  instagramUrl: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  youtubeUrl: string | null;

  @Column({ type: 'boolean', default: false })
  votingOpen: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Vote, (vote) => vote.candidate)
  votes: Vote[];
}
