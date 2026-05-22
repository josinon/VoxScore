import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventSettings } from '../entities/event-settings.entity';

const DEFAULT_ID = 'default';

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

  private async getOrCreate(): Promise<EventSettings> {
    let row = await this.settings.findOne({ where: { id: DEFAULT_ID } });
    if (!row) {
      row = this.settings.create({ id: DEFAULT_ID, rankingPublished: false });
      row = await this.settings.save(row);
    }
    return row;
  }
}
