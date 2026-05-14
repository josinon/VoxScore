import { ApiProperty } from '@nestjs/swagger';

export class VoteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  candidateId!: string;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  criteriaScores!: Record<string, number>;

  @ApiProperty()
  createdAt!: Date;
}
