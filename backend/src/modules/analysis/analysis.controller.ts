import { Body, Controller, Post } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { OpenRouterAnalysisDto } from './dto/openrouter-analysis.dto';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('openrouter')
  analyze(@Body() body: OpenRouterAnalysisDto) {
    return this.analysisService.analyzeWithOpenRouter(body);
  }
}
