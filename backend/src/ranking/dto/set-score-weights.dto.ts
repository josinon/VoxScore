import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class SetScoreWeightsDto {
  @ApiProperty({
    example: 80,
    minimum: 0,
    maximum: 100,
    description:
      'Percentual dos jurados no modo JURADOS+PÚBLICO (0–100). O público fica com o restante (100 − este valor).',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  judgeWeightPercent!: number;
}
