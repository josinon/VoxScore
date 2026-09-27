import { ApiProperty } from '@nestjs/swagger';

export class CandidatePenaltyDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 0.5 })
  amount!: number;

  @ApiProperty({ example: 'Atraso na apresentação' })
  reason!: string;

  @ApiProperty()
  createdAt!: Date;
}
