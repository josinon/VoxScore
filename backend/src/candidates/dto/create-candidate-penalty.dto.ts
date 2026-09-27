import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import {
  SCORE_PENALTY_MAX,
  SCORE_PENALTY_MIN,
  VOTE_SCORE_STEP,
} from '../../voting/vote-score';

export class CreateCandidatePenaltyDto {
  @ApiProperty({
    example: 0.5,
    description: `Valor da penalidade (${SCORE_PENALTY_MIN + VOTE_SCORE_STEP}–${SCORE_PENALTY_MAX}, passos de ${VOTE_SCORE_STEP}). Use 0 só se remover a linha.`,
    minimum: VOTE_SCORE_STEP,
    maximum: SCORE_PENALTY_MAX,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(VOTE_SCORE_STEP)
  @Max(SCORE_PENALTY_MAX)
  amount!: number;

  @ApiProperty({
    example: 'Atraso na apresentação',
    maxLength: 500,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
