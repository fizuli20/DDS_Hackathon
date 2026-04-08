import { IsOptional, IsString } from 'class-validator';

export class CohortAggregateQueryDto {
  @IsOptional()
  @IsString()
  cohort?: string;
}
