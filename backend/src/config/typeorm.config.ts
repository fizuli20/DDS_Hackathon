import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { CohortEntity } from '../database/entities/cohort.entity';
import { StudentEntity } from '../database/entities/student.entity';
import { ActivityEventEntity } from '../database/entities/activity-event.entity';
import { ScoreSnapshotEntity } from '../database/entities/score-snapshot.entity';
import { NotificationLogEntity } from '../database/entities/notification-log.entity';
import { ImportEntity } from '../database/entities/import.entity';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { DataSourceEntity } from '../database/entities/data-source.entity';
import { DataSourceRecordEntity } from '../database/entities/data-source-record.entity';
import { UnifiedStudentEntity } from '../database/entities/unified-student.entity';

/** Supabase / managed Postgres typically require TLS. Local Docker often does not. */
function shouldUseSsl(config: ConfigService, databaseUrl: string | undefined): boolean {
  const explicit = config.get<string>('DATABASE_SSL');
  if (explicit === 'false') return false;
  if (explicit === 'true') return true;
  if (!databaseUrl) return false;
  return /supabase\.(co|com)/i.test(databaseUrl);
}

export const typeormConfig = (config: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = config.get<string>('DATABASE_URL');
  const useSsl = shouldUseSsl(config, databaseUrl);

  return {
    type: 'postgres',
    url: databaseUrl,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    entities: [
      UserEntity,
      CohortEntity,
      StudentEntity,
      ActivityEventEntity,
      ScoreSnapshotEntity,
      NotificationLogEntity,
      ImportEntity,
      AuditLogEntity,
      DataSourceEntity,
      DataSourceRecordEntity,
      UnifiedStudentEntity,
    ],
    synchronize: config.get<string>('TYPEORM_SYNC', 'true') === 'true',
  };
};
