import { IsDateString } from 'class-validator';

export class StudentAttendanceDto {
  @IsDateString()
  checkInAt: string;

  @IsDateString()
  checkOutAt: string;
}
