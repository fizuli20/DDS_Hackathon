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

export const typeormConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: config.get<string>('DATABASE_URL'),
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
});
