import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/user-role.enum';
import { RealtimeHubService } from '../realtime/realtime-hub.service';
import { RankingResponseDto } from './dto/ranking-response.dto';
import { SetRankingPublishedDto } from './dto/set-ranking-published.dto';
import { RankingService } from './ranking.service';

type JwtUser = { userId: string; role: string };

@ApiTags('ranking')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@Controller('ranking')
@UseGuards(AuthGuard('jwt'))
export class RankingController {
  constructor(
    private readonly rankingService: RankingService,
    private readonly realtime: RealtimeHubService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Leaderboard ou contagens de avaliações',
    description:
      'Com `resultsPublished=false`, público e jurados veem apenas `voteCount` por candidato (sem notas). ADMIN vê sempre as notas. Após publicar, inclui ranking completo e vencedores.',
  })
  @ApiOkResponse({ type: RankingResponseDto })
  async getRanking(
    @Req() req: Request & { user: JwtUser },
  ): Promise<RankingResponseDto> {
    return this.rankingService.getLeaderboard(req.user.role);
  }

  @Patch('publish')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Publicar ou ocultar resultados do ranking (ADMIN)' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { published: { type: 'boolean' } },
    },
  })
  @ApiForbiddenResponse()
  async setRankingPublished(
    @Body() body: SetRankingPublishedDto,
  ): Promise<{ published: boolean }> {
    const published = await this.rankingService.setRankingPublished(
      body.published,
    );
    this.realtime.broadcastRankingChanged();
    return { published };
  }
}
