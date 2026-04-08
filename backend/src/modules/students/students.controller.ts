import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentAttendanceDto } from './dto/student-attendance.dto';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  @Post(':studentId/attendance-log')
  addAttendanceLog(
    @Param('studentId') studentId: string,
    @Body() body: StudentAttendanceDto,
  ) {
    return this.studentsService.addAttendanceSession(
      studentId,
      body.checkInAt,
      body.checkOutAt,
    );
  }

  @Get(':studentId/activity-score')
  getActivityScore(@Param('studentId') studentId: string) {
    return this.studentsService.getActivityScore(studentId);
  }
}
