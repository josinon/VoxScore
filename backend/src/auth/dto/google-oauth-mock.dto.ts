import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

/** Corpo do mock OAuth (Fase 3). Só aceite quando `AUTH_GOOGLE_MOCK_ENABLED=true`. */
export class GoogleOAuthMockDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  photoUrl?: string;
}
