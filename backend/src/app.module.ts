import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { typeormConfig } from './config/typeorm.config';
import { UsersModule } from './modules/users/users.module';
import { CohortsModule } from './modules/cohorts/cohorts.module';
import { StudentsModule } from './modules/students/students.module';
import { ActivityEventsModule } from './modules/activity-events/activity-events.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { DataSourcesModule } from './modules/data-sources/data-sources.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';

const enableDb = process.env.ENABLE_DB === 'true';
const enableQueue = process.env.ENABLE_QUEUE === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(enableDb
      ? [
          TypeOrmModule.forRootAsync({
            useFactory: typeormConfig,
            inject: [ConfigService],
          }),
        ]
      : []),
    ...(enableQueue
      ? [
          BullModule.forRoot({
            connection: {
              host: process.env.REDIS_HOST || 'localhost',
              port: Number(process.env.REDIS_PORT || 6379),
            },
          }),
        ]
      : []),
    ...(enableDb
      ? [UsersModule, AuthModule, AuditModule, CohortsModule, StudentsModule, ActivityEventsModule, DataSourcesModule]
      : []),
    ...(enableQueue ? [ScoringModule] : []),
    AnalysisModule,
  ],
})
export class AppModule {}
