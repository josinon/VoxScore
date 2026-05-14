import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vote } from './vote.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  displayName: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  photoUrl: string | null;

  /** PUBLIC | JUDGE | ADMIN */
  @Column({ type: 'varchar', length: 32 })
  role: string;

  @Column({ type: 'boolean', default: false })
  disabled: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];
}
