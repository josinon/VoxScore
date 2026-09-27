import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { SCORE_PENALTY_MAX, SCORE_PENALTY_MIN } from '../../voting/vote-score';

export class CreateCandidateDto {
  @ApiProperty({ example: 'Nome Artístico' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'Título da música' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  musicTitle!: string;

  @ApiProperty({ example: 'Pop' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  genre!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(16000)
  bio!: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg' })
  @IsUrl({
    protocols: ['http', 'https'],
    require_tld: false,
    require_protocol: true,
  })
  @MaxLength(2048)
  photoUrl!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v: unknown) => v != null && v !== '')
  @IsUrl({
    protocols: ['http', 'https'],
    require_tld: false,
    require_protocol: true,
  })
  @MaxLength(2048)
  instagramUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v: unknown) => v != null && v !== '')
  @IsUrl({
    protocols: ['http', 'https'],
    require_tld: false,
    require_protocol: true,
  })
  @MaxLength(2048)
  youtubeUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  votingOpen?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;

  @ApiPropertyOptional({
    example: 0.5,
    description:
      'Penalidade subtraída da nota final no ranking (0–10, passos de 0,5).',
    minimum: SCORE_PENALTY_MIN,
    maximum: SCORE_PENALTY_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(SCORE_PENALTY_MIN)
  @Max(SCORE_PENALTY_MAX)
  @Type(() => Number)
  scorePenalty?: number;
}
