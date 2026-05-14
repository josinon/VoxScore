import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/user-role.enum';
import { CandidatesService } from './candidates.service';
import { CandidateResponseDto } from './dto/candidate-response.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

type JwtUser = { userId: string; role: string };

@ApiTags('candidates')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT em falta ou inválido' })
@Controller('candidates')
@UseGuards(AuthGuard('jwt'))
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar candidatos',
    description:
      'Público/jurado: apenas `active: true`. **ADMIN**: todos os candidatos (incl. inativos), mesma ordenação.',
  })
  @ApiOkResponse({ type: CandidateResponseDto, isArray: true })
  async list(
    @Req() req: Request & { user: JwtUser },
  ): Promise<CandidateResponseDto[]> {
    if ((req.user.role as UserRole) === UserRole.ADMIN) {
      return this.candidatesService.findAllForAdmin();
    }
    return this.candidatesService.findAllForAuthenticated();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de candidato' })
  @ApiOkResponse({ type: CandidateResponseDto })
  @ApiNotFoundResponse()
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: JwtUser },
  ): Promise<CandidateResponseDto> {
    return this.candidatesService.findOneById(id, req.user.role);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar candidato (ADMIN)' })
  @ApiCreatedResponse({ type: CandidateResponseDto })
  @ApiForbiddenResponse()
  async create(@Body() dto: CreateCandidateDto): Promise<CandidateResponseDto> {
    return this.candidatesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar candidato (ADMIN)' })
  @ApiOkResponse({ type: CandidateResponseDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCandidateDto,
  ): Promise<CandidateResponseDto> {
    return this.candidatesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar candidato (ADMIN)' })
  @ApiForbiddenResponse()
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.candidatesService.remove(id);
  }
}
