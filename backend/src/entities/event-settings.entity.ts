import { Column, Entity, PrimaryColumn } from 'typeorm';
import { VotingMode } from '../common/voting-mode.enum';

/** Configuração global do evento (linha única `id = default`). */
@Entity('event_settings')
export class EventSettings {
  @PrimaryColumn({ type: 'varchar', length: 64, default: 'default' })
  id: string;

  /** Quando `true`, o ranking expõe notas e vencedores para público e jurados. */
  @Column({ type: 'boolean', default: false })
  rankingPublished: boolean;

  /**
   * Quem pode votar e como a nota final é calculada.
   * @see VotingMode
   */
  @Column({ type: 'varchar', length: 32, default: VotingMode.JUDGES_AND_PUBLIC })
  votingMode: VotingMode;

  /**
   * Peso dos jurados no modo {@link VotingMode.JUDGES_AND_PUBLIC} (0–100).
   * O peso do público é `100 - judgeWeightPercent`.
   */
  @Column({ type: 'smallint', default: 80 })
  judgeWeightPercent: number;
}
