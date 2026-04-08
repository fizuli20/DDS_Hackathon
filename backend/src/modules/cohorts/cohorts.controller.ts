import { Controller, Get } from '@nestjs/common';
import { CohortsService } from './cohorts.service';

@Controller('cohorts')
export class CohortsController {
  constructor(private readonly cohortsService: CohortsService) {}

  @Get()
  findAll() {
    return this.cohortsService.findAll();
  }
}
