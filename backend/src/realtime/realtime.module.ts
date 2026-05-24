import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../entities/user.entity';
import { RedisModule } from '../redis/redis.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeHubService } from './realtime-hub.service';

@Module({
  imports: [RedisModule, AuthModule, TypeOrmModule.forFeature([User])],
  providers: [RealtimeHubService, RealtimeGateway],
  exports: [RealtimeHubService],
})
export class RealtimeModule {}
