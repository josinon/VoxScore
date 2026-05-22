import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Configuração global do evento (linha única `id = default`). */
@Entity('event_settings')
export class EventSettings {
  @PrimaryColumn({ type: 'varchar', length: 64, default: 'default' })
  id: string;

  /** Quando `true`, o ranking expõe notas e vencedores para público e jurados. */
  @Column({ type: 'boolean', default: false })
  rankingPublished: boolean;
}
