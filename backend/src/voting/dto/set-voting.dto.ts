import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetVotingDto {
  @ApiProperty({ description: 'Se a votação está aberta para este candidato' })
  @IsBoolean()
  open!: boolean;
}
