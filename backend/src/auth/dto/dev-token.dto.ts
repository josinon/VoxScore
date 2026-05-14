import { IsEmail, MaxLength } from 'class-validator';

/** Corpo do endpoint de desenvolvimento `POST /auth/dev/token`. */
export class DevTokenDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
