import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';
import { ScoringProcessor } from './processors/scoring.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'scoring' })],
  controllers: [ScoringController],
  providers: [ScoringService, ScoringProcessor],
})
export class ScoringModule {}
