import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('scoring')
export class ScoringProcessor extends WorkerHost {
  async process(job: Job<{ studentId: string; windowDays: 7 | 30 | 90 }>) {
    return { ok: true, ...job.data };
  }
}
