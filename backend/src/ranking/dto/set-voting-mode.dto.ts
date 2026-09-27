import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { VotingMode } from '../../common/voting-mode.enum';

export class SetVotingModeDto {
  @ApiProperty({
    enum: VotingMode,
    example: VotingMode.JUDGES_AND_PUBLIC,
    description:
      'JUDGES_AND_PUBLIC (80/20), PUBLIC_ONLY ou JUDGES_ONLY.',
  })
  @IsEnum(VotingMode)
  votingMode!: VotingMode;
}
