import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) {
      return true;
    }
    const req = context.switchToHttp().getRequest<{
      user?: { userId: string; role: string };
    }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException();
    }
    if (!requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
