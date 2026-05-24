import { DataSource } from 'typeorm';
import { UserRole } from '../../src/common/user-role.enum';
import { User } from '../../src/entities/user.entity';

/**
 * Email de um ADMIN ativo na base (seed ou ambiente).
 * Evita 401 quando já existe admin mas com email diferente de `BOOTSTRAP_ADMIN_EMAIL`.
 */
export async function resolveAdminEmail(ds: DataSource): Promise<string> {
  const admin = await ds.getRepository(User).findOne({
    where: { role: UserRole.ADMIN, disabled: false },
    order: { createdAt: 'ASC' },
  });
  if (admin) {
    return admin.email;
  }
  return process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@voxscore.local';
}
