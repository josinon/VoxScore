import {
  Body,
  Controller,
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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CandidatesService } from '../candidates/candidates.service';
import { CandidateResponseDto } from '../candidates/dto/candidate-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/user-role.enum';
import { SetVotingDto } from './dto/set-voting.dto';
import { SubmitVoteDto } from './dto/submit-vote.dto';
import { VoteResponseDto } from './dto/vote-response.dto';
import { VotingService } from './voting.service';

type JwtUser = { userId: string; role: string };

@ApiTags('voting')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@Controller('candidates')
@UseGuards(AuthGuard('jwt'))
export class VotingController {
  constructor(
    private readonly votingService: VotingService,
    private readonly candidatesService: CandidatesService,
  ) {}

  @Post(':id/votes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submeter voto (PUBLIC / JUDGE)' })
  @ApiCreatedResponse({ type: VoteResponseDto })
  @ApiForbiddenResponse({
    description: 'ADMIN, votação fechada, ou papel inválido',
  })
  @ApiNotFoundResponse()
  @ApiConflictResponse({
    description: 'Já existe voto para este par utilizador/candidato',
  })
  async submitVote(
    @Param('id', ParseUUIDPipe) candidateId: string,
    @Req() req: Request & { user: JwtUser },
    @Body() body: SubmitVoteDto,
  ): Promise<VoteResponseDto> {
    const vote = await this.votingService.submitVote(
      candidateId,
      req.user.userId,
      req.user.role,
      body.criteriaScores,
    );
    const dto = new VoteResponseDto();
    dto.id = vote.id;
    dto.candidateId = candidateId;
    dto.criteriaScores = vote.criteriaScores;
    dto.createdAt = vote.createdAt;
    return dto;
  }

  @Patch(':id/voting')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Abrir/fechar votação por candidato (ADMIN)' })
  @ApiOkResponse({ type: CandidateResponseDto })
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  async setVoting(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetVotingDto,
  ): Promise<CandidateResponseDto> {
    return this.candidatesService.setVotingOpen(id, dto.open);
  }
}
