import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

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
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  @MaxLength(2048)
  photoUrl!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v: unknown) => v != null && v !== '')
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  @MaxLength(2048)
  instagramUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v: unknown) => v != null && v !== '')
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
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
}
