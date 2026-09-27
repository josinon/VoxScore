import { ApiProperty } from '@nestjs/swagger';
import { CandidatePenaltyDto } from './candidate-penalty.dto';

export class CandidateResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  musicTitle!: string;

  @ApiProperty()
  genre!: string;

  @ApiProperty()
  bio!: string;

  @ApiProperty()
  photoUrl!: string;

  @ApiProperty({ nullable: true })
  instagramUrl!: string | null;

  @ApiProperty({ nullable: true })
  youtubeUrl!: string | null;

  @ApiProperty()
  votingOpen!: boolean;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  active!: boolean;

  @ApiProperty({
    example: 0,
    description:
      'Soma das penalidades individuais subtraída da nota final no ranking.',
  })
  scorePenalty!: number;

  @ApiProperty({ type: [CandidatePenaltyDto] })
  penalties!: CandidatePenaltyDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
