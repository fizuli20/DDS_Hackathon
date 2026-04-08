import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DataSourcesService } from './data-sources.service';
import { CreateDataSourceDto } from './dto/create-data-source.dto';
import { UpdateDataSourceDto } from './dto/update-data-source.dto';
import { CohortAggregateQueryDto } from './dto/cohort-aggregate-query.dto';

@Controller('data-sources')
export class DataSourcesController {
  constructor(private readonly dataSourcesService: DataSourcesService) {}

  @Get()
  list() {
    return this.dataSourcesService.list();
  }

  @Post()
  create(@Body() body: CreateDataSourceDto) {
    return this.dataSourcesService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateDataSourceDto) {
    return this.dataSourcesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dataSourcesService.remove(id);
  }

  @Post(':id/sync')
  syncOne(@Param('id') id: string) {
    return this.dataSourcesService.syncOne(id);
  }

  @Post('sync/all')
  syncAll() {
    return this.dataSourcesService.syncAllActive();
  }

  @Get('aggregate')
  aggregate(@Query() query: CohortAggregateQueryDto) {
    return this.dataSourcesService.aggregateByCohort(query.cohort);
  }
}
