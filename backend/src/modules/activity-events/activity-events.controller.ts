import { Controller, Get } from '@nestjs/common';
import { ActivityEventsService } from './activity-events.service';

@Controller('activity-events')
export class ActivityEventsController {
  constructor(private readonly activityEventsService: ActivityEventsService) {}

  @Get()
  findAll() {
    return this.activityEventsService.findAll();
  }
}
