import { IsOptional, IsString } from 'class-validator';

export class GoogleSheetAnalysisDto {
  @IsOptional()
  @IsString()
  sheetUrl?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  reportType?: string;
}
