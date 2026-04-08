import { Body, Controller, Get, Query, Post } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { OpenRouterAnalysisDto } from './dto/openrouter-analysis.dto';
import { GoogleSheetAnalysisDto } from './dto/google-sheet-analysis.dto';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('openrouter')
  analyze(@Body() body: OpenRouterAnalysisDto) {
    return this.analysisService.analyzeWithOpenRouter(body);
  }

  @Post('google-sheet')
  analyzeGoogleSheet(@Body() body: GoogleSheetAnalysisDto) {
    return this.analysisService.analyzeGoogleSheet(body);
  }

  @Post('google-sheet-report')
  generateGoogleSheetReport(@Body() body: GoogleSheetAnalysisDto) {
    return this.analysisService.buildStudentReportFromSheet(body);
  }

  @Post('google-sheet-trends')
  analyzeGoogleSheetTrends(@Body() body: GoogleSheetAnalysisDto) {
    return this.analysisService.analyzeStudentTrendsFromSheet(body);
  }

  @Get('google-sheet-data')
  getGoogleSheetData(@Query() query: GoogleSheetAnalysisDto) {
    return this.analysisService.getGoogleSheetData(query);
  }
}
