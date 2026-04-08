import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class OpenRouterAnalysisDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number;
}
