import { Injectable } from '@nestjs/common';

type StudentSession = {
  checkInAt: string;
  checkOutAt: string;
  durationMinutes: number;
};

@Injectable()
export class StudentsService {
  private readonly sessionsByStudent = new Map<string, StudentSession[]>();

  findAll() {
    return [];
  }

  addAttendanceSession(studentId: string, checkInAt: string, checkOutAt: string) {
    const checkInDate = new Date(checkInAt);
    const checkOutDate = new Date(checkOutAt);
    const durationMs = checkOutDate.getTime() - checkInDate.getTime();
    const durationMinutes = Math.max(0, Math.round(durationMs / 60000));

    const existing = this.sessionsByStudent.get(studentId) || [];
    const next: StudentSession[] = [
      {
        checkInAt,
        checkOutAt,
        durationMinutes,
      },
      ...existing,
    ].slice(0, 30);

    this.sessionsByStudent.set(studentId, next);
    return { studentId, saved: true, session: next[0] };
  }

  getActivityScore(studentId: string) {
    const sessions = this.sessionsByStudent.get(studentId) || [];
    const totalMinutes = sessions.reduce((sum, item) => sum + item.durationMinutes, 0);
    const averageMinutes = sessions.length ? totalMinutes / sessions.length : 0;

    // Demo scoring heuristic for student-side visibility.
    const score = Math.min(100, Math.round(40 + averageMinutes / 3 + sessions.length * 4));

    return {
      studentId,
      score,
      sessionsCount: sessions.length,
      averageSessionMinutes: Math.round(averageMinutes),
      recentSessions: sessions.slice(0, 10),
    };
  }
}
