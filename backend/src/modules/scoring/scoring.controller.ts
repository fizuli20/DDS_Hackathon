import { Body, Controller, Post } from '@nestjs/common';
import { ScoringService } from './scoring.service';

@Controller('scoring')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post('recompute')
  recompute(@Body() body: { studentId: string; windowDays?: 7 | 30 | 90 }) {
    return this.scoringService.enqueueRecompute(body.studentId, body.windowDays || 30);
  }
}
