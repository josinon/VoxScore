import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RankingResponseDto } from './dto/ranking-response.dto';
import { RankingService } from './ranking.service';

@ApiTags('ranking')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@Controller('ranking')
@UseGuards(AuthGuard('jwt'))
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get()
  @ApiOperation({
    summary: 'Leaderboard (ponderação 60% jurados / 40% público)',
    description:
      'Apenas candidatos ativos. Ver README do produto e comentários em `ranking-formula.ts` para o comportamento quando falta um dos grupos de votos.',
  })
  @ApiOkResponse({ type: RankingResponseDto })
  async getRanking(): Promise<RankingResponseDto> {
    return this.rankingService.getLeaderboard();
  }
}
