import { ApiProperty } from '@nestjs/swagger';

export class RankingEntryDto {
  @ApiProperty({ example: 1 })
  rank: number;

  @ApiProperty({ format: 'uuid' })
  candidateId: string;

  @ApiProperty()
  candidateName: string;

  @ApiProperty({
    description:
      'Média da média por voto dos jurados (1–10 por critério); null se não houver votos de jurados.',
    nullable: true,
    example: 7.5,
  })
  judgeCompositeAverage: number | null;

  @ApiProperty({
    description:
      'Média da média por voto do público; null se não houver votos públicos.',
    nullable: true,
    example: 8,
  })
  publicCompositeAverage: number | null;

  @ApiProperty({
    description:
      '60% jurados + 40% público quando ambos existem; só um grupo → essa média; sem votos → 0.',
    example: 7.4,
  })
  finalScore: number;

  @ApiProperty({
    description: 'Média por critério (jurados); null se não houver votos de jurados.',
    nullable: true,
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  judgeCriteriaAverages: Record<string, number> | null;

  @ApiProperty({
    description: 'Média por critério (público); null se não houver votos públicos.',
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

  @ApiProperty({ type: [RankingEntryDto] })
  entries: RankingEntryDto[];
}
