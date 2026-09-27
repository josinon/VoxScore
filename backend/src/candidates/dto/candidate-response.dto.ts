import { ApiProperty } from '@nestjs/swagger';

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
      'Penalidade subtraída da nota final no ranking (0–10, passos de 0,5).',
  })
  scorePenalty!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
