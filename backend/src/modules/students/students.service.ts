import { BadRequestException, Injectable } from '@nestjs/common';

type StudentSession = {
  checkInAt: string;
  checkOutAt: string;
  durationMinutes: number;
};

@Injectable()
export class StudentsService {
  private readonly sessionsByStudent = new Map<string, StudentSession[]>();
  private readonly studentIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,63}$/;

  findAll() {
    return [];
  }

  addAttendanceSession(studentId: string, checkInAt: string, checkOutAt: string) {
    const normalizedStudentId = studentId.trim();
    if (!this.studentIdPattern.test(normalizedStudentId)) {
      throw new BadRequestException('Invalid student ID format.');
    }

    const checkInDate = new Date(checkInAt);
    const checkOutDate = new Date(checkOutAt);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      throw new BadRequestException('Invalid check-in/check-out datetime.');
    }
    const durationMs = checkOutDate.getTime() - checkInDate.getTime();
    if (durationMs <= 0) {
      throw new BadRequestException('Check-out time must be later than check-in time.');
    }
    const durationMinutes = Math.max(0, Math.round(durationMs / 60000));

    const existing = this.sessionsByStudent.get(normalizedStudentId) || [];
    const next: StudentSession[] = [
      {
        checkInAt,
        checkOutAt,
        durationMinutes,
      },
      ...existing,
    ].slice(0, 30);

    this.sessionsByStudent.set(normalizedStudentId, next);
    return { studentId: normalizedStudentId, saved: true, session: next[0] };
  }

  getActivityScore(studentId: string) {
    const normalizedStudentId = studentId.trim();
    if (!this.studentIdPattern.test(normalizedStudentId)) {
      throw new BadRequestException('Invalid student ID format.');
    }
    const sessions = this.sessionsByStudent.get(normalizedStudentId) || [];
    const totalMinutes = sessions.reduce((sum, item) => sum + item.durationMinutes, 0);
    const averageMinutes = sessions.length ? totalMinutes / sessions.length : 0;

    // Demo scoring heuristic for student-side visibility.
    const score = Math.min(100, Math.round(40 + averageMinutes / 3 + sessions.length * 4));

    return {
      studentId: normalizedStudentId,
      score,
      sessionsCount: sessions.length,
      averageSessionMinutes: Math.round(averageMinutes),
      recentSessions: sessions.slice(0, 10),
    };
  }
}
