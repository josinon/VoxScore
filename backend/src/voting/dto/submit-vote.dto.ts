import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject } from 'class-validator';

/**
 * Corpo de `POST /candidates/:id/votes`.
 * As chaves e quantidade de `criteriaScores` são validadas pelo serviço conforme `role` do utilizador.
 */
export class SubmitVoteDto {
  @ApiProperty({
    example: {
      entertainment: 8,
      emotion: 7,
      likedTheMusic: 9,
      wouldListenAgain: 8,
    },
    description: 'Mapa critério → nota inteira 1–10 (chaves conforme papel)',
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  @IsObject()
  @Type(() => Object)
  criteriaScores!: Record<string, number>;
}
