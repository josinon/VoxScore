import { UserRole } from '../../common/user-role.enum';

export class MeResponseDto {
  id!: string;
  email!: string;
  displayName!: string;
  photoUrl!: string | null;
  role!: UserRole;
  disabled!: boolean;
  createdAt!: Date;
}
