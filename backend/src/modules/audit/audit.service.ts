import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  async log(
    actorUserId: string | null,
    action: string,
    targetType?: string | null,
    targetId?: string | null,
    diff?: Record<string, unknown> | null,
  ) {
    const row = this.repo.create({
      actorUserId,
      action,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      diff: diff ?? null,
    });
    await this.repo.save(row);
    return row;
  }

  async listRecent(limit = 100) {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
