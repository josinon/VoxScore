import { Controller, Get, Param, ParseUUIDPipe, Patch, Body, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/user-role.enum';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import { UsersService } from './users.service';

export type JwtRequestUser = { userId: string; role: string };

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: Request & { user: JwtRequestUser }) {
    return this.usersService.getMe(req.user.userId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Listar utilizadores (ADMIN)',
    description: 'Resposta paginada; filtros opcionais `q`, `role`, `disabled`.',
  })
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  async list(
    @Query() query: ListUsersQueryDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.usersService.findAllForAdmin(query);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchUserDto,
  ): Promise<ReturnType<UsersService['patchUserAsAdmin']>> {
    return this.usersService.patchUserAsAdmin(id, dto);
  }
}
