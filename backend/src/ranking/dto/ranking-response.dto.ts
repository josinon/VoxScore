import { ApiProperty } from '@nestjs/swagger';
import { VotingMode } from '../../common/voting-mode.enum';

export class RankingEntryDto {
  @ApiProperty({
    example: 1,
    description:
      'Posição no pódio; 0 quando os resultados ainda não foram publicados (vista público/jurado).',
  })
  rank: number;

  @ApiProperty({ format: 'uuid' })
  candidateId: string;

  @ApiProperty()
  candidateName: string;

  @ApiProperty({
    description:
      'Número de pessoas que avaliaram este candidato (soma de votos de jurados e público).',
    example: 12,
  })
  voteCount: number;

  @ApiProperty({
    description:
      'Média da média por voto dos jurados (1–10 por critério); null se oculto ou sem votos de jurados.',
    nullable: true,
    example: 7.5,
  })
  judgeCompositeAverage: number | null;

  @ApiProperty({
    description:
      'Média da média por voto do público; null se oculto ou sem votos públicos.',
    nullable: true,
    example: 8,
  })
  publicCompositeAverage: number | null;

  @ApiProperty({
    description:
      'Nota calculada pelos votos (pesos do modo combinado quando aplicável); null se resultados ocultos.',
    nullable: true,
    example: 7.4,
  })
  computedScore: number | null;

  @ApiProperty({
    description:
      'Penalidade administrativa subtraída de `computedScore`; null se resultados ocultos.',
    nullable: true,
    example: 0.5,
  })
  scorePenalty: number | null;

  @ApiProperty({
    description:
      'Nota final após penalidade (`max(0, computedScore - scorePenalty)`); null se resultados ocultos.',
    nullable: true,
    example: 6.9,
  })
  finalScore: number | null;

  @ApiProperty({
    description: 'Média por critério (jurados); null se oculto ou sem votos de jurados.',
    nullable: true,
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  judgeCriteriaAverages: Record<string, number> | null;

  @ApiProperty({
    description: 'Média por critério (público); null se oculto ou sem votos públicos.',
    nullable: true,
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  publicCriteriaAverages: Record<string, number> | null;
}

export class RankingResponseDto {
  @ApiProperty({
    description:
      'Versão do contrato JSON; incrementar apenas com mudanças compatíveis ou breaking documentadas.',
    example: 1,
  })
  schemaVersion: 1;

  @ApiProperty({
    description:
      'Quando `true`, notas e vencedores estão visíveis para público e jurados.',
  })
  resultsPublished: boolean;

  @ApiProperty({
    enum: VotingMode,
    example: VotingMode.JUDGES_AND_PUBLIC,
    description:
      'Modo do evento: quem vota e como a nota final é calculada.',
  })
  votingMode: VotingMode;

  @ApiProperty({
    example: 80,
    description:
      'Peso dos jurados (%) no modo JUDGES_AND_PUBLIC. Público = 100 − este valor.',
  })
  judgeWeightPercent: number;

  @ApiProperty({
    example: 20,
    description: 'Peso do público (%) no modo JUDGES_AND_PUBLIC.',
  })
  publicWeightPercent: number;

  @ApiProperty({ type: [RankingEntryDto] })
  entries: RankingEntryDto[];
}
