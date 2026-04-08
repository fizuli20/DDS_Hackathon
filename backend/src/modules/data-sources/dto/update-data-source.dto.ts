import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class UpdateDataSourceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl({ require_tld: true }, { message: 'sheetUrl must be a valid URL' })
  sheetUrl?: string;

  @IsOptional()
  @IsIn(['pld', 'task_exam', 'attendance', 'combined', 'custom'])
  type?: string;

  @IsOptional()
  @IsString()
  cohort?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  @IsOptional()
  @IsObject()
  columnMapping?: Record<string, string>;
}
