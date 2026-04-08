import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceEntity } from '../../database/entities/data-source.entity';
import { DataSourceRecordEntity } from '../../database/entities/data-source-record.entity';
import { UnifiedStudentEntity } from '../../database/entities/unified-student.entity';
import { DataSourcesController } from './data-sources.controller';
import { DataSourcesService } from './data-sources.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataSourceEntity, DataSourceRecordEntity, UnifiedStudentEntity]),
  ],
  controllers: [DataSourcesController],
  providers: [DataSourcesService],
  exports: [DataSourcesService],
})
export class DataSourcesModule {}
