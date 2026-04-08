import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Track } from '../../common/enums/roles.enum';
import { CohortEntity } from './cohort.entity';
import { StudentEntity } from './student.entity';
import { UserEntity } from './user.entity';

export enum ActivitySource {
  MANUAL = 'manual',
  IMPORT = 'import',
  SYNC = 'sync',
}

export enum ActivityType {
  PLD = 'pld',
  EXAM = 'exam',
  TASK = 'task',
  ATTENDANCE = 'attendance',
}

@Entity('activity_events')
@Index('ix_activity_events_student_occurred_at', ['studentId', 'occurredAt'])
@Index('ix_activity_events_cohort_type_occurred_at', ['cohortId', 'type', 'occurredAt'])
export class ActivityEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => StudentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  @Column({ name: 'cohort_id', type: 'uuid', nullable: true })
  cohortId: string | null;

  @ManyToOne(() => CohortEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cohort_id' })
  cohort: CohortEntity | null;

  @Column({ type: 'enum', enum: Track, enumName: 'track_enum', nullable: true })
  track: Track | null;

  @Column({ type: 'enum', enum: ActivitySource, enumName: 'activity_source_enum', default: ActivitySource.MANUAL })
  source: ActivitySource;

  @Column({ type: 'enum', enum: ActivityType, enumName: 'activity_type_enum' })
  type: ActivityType;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  // PLD: {sessionId, attended, minutes, notes}
  // Exam: {examKey, name, score, maxScore}
  // Task: {taskKey, name, status, grade, submittedAt}
  // Attendance: {classKey, attended}
  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
