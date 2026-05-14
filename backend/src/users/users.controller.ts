import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { UsersService } from './users.service';

export type JwtRequestUser = { userId: string; role: string };

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: Request & { user: JwtRequestUser }) {
    return this.usersService.getMe(req.user.userId);
  }
}
