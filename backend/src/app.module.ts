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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: typeormConfig,
      inject: [ConfigService],
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      },
    }),
    UsersModule,
    CohortsModule,
    StudentsModule,
    ActivityEventsModule,
    ScoringModule,
  ],
})
export class AppModule {}
