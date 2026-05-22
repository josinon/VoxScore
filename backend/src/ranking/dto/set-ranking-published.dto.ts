import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetRankingPublishedDto {
  @ApiProperty({ description: 'Publicar ou ocultar notas e vencedores no ranking' })
  @IsBoolean()
  published!: boolean;
}
