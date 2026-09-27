import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  isVotingMode,
  VotingMode,
} from '../common/voting-mode.enum';
import { EventSettings } from '../entities/event-settings.entity';

const DEFAULT_ID = 'default';
export const DEFAULT_JUDGE_WEIGHT_PERCENT = 80;

export type ScoreWeights = {
  judgeWeightPercent: number;
  publicWeightPercent: number;
};

@Injectable()
export class EventSettingsService {
  constructor(
    @InjectRepository(EventSettings)
    private readonly settings: Repository<EventSettings>,
  ) {}

  async isRankingPublished(): Promise<boolean> {
    const row = await this.getOrCreate();
    return row.rankingPublished;
  }

  async setRankingPublished(published: boolean): Promise<boolean> {
    const row = await this.getOrCreate();
    row.rankingPublished = published;
    await this.settings.save(row);
    return row.rankingPublished;
  }

  async getVotingMode(): Promise<VotingMode> {
    const row = await this.getOrCreate();
    return this.normalizeMode(row.votingMode);
  }

  async setVotingMode(mode: VotingMode): Promise<VotingMode> {
    const row = await this.getOrCreate();
    row.votingMode = mode;
    await this.settings.save(row);
    return row.votingMode;
  }

  async getScoreWeights(): Promise<ScoreWeights> {
    const row = await this.getOrCreate();
    const judgeWeightPercent = this.normalizeJudgeWeight(
      row.judgeWeightPercent,
    );
    return {
      judgeWeightPercent,
      publicWeightPercent: 100 - judgeWeightPercent,
    };
  }

  async setJudgeWeightPercent(percent: number): Promise<ScoreWeights> {
    if (
      !Number.isInteger(percent) ||
      percent < 0 ||
      percent > 100
    ) {
      throw new BadRequestException(
        'judgeWeightPercent deve ser um inteiro entre 0 e 100',
      );
    }
    const row = await this.getOrCreate();
    row.judgeWeightPercent = percent;
    await this.settings.save(row);
    return {
      judgeWeightPercent: percent,
      publicWeightPercent: 100 - percent,
    };
  }

  private normalizeMode(value: string | VotingMode): VotingMode {
    if (isVotingMode(value)) {
      return value;
    }
    return VotingMode.JUDGES_AND_PUBLIC;
  }

  private normalizeJudgeWeight(value: number | null | undefined): number {
    if (
      typeof value === 'number' &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 100
    ) {
      return value;
    }
    return DEFAULT_JUDGE_WEIGHT_PERCENT;
  }

  private async getOrCreate(): Promise<EventSettings> {
    let row = await this.settings.findOne({ where: { id: DEFAULT_ID } });
    if (!row) {
      row = this.settings.create({
        id: DEFAULT_ID,
        rankingPublished: false,
        votingMode: VotingMode.JUDGES_AND_PUBLIC,
        judgeWeightPercent: DEFAULT_JUDGE_WEIGHT_PERCENT,
      });
      row = await this.settings.save(row);
    }
    return row;
  }
}
