import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ScoringService {
  constructor(@InjectQueue('scoring') private readonly scoringQueue: Queue) {}

  enqueueRecompute(studentId: string, windowDays: 7 | 30 | 90) {
    return this.scoringQueue.add('recompute', { studentId, windowDays }, { removeOnComplete: true });
  }
}
