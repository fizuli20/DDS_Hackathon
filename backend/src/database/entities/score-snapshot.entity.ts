import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StudentEntity } from './student.entity';

export enum RiskLevel {
  STRONG = 'strong',
  MEDIUM = 'medium',
  WEAK = 'weak',
  AT_RISK = 'at_risk',
}

export enum Trend {
  UP = 'up',
  STABLE = 'stable',
  DOWN = 'down',
}

@Entity('score_snapshots')
@Check(`"overall_score" BETWEEN 0 AND 100`)
@Index('ux_score_snapshots_student_date_window', ['studentId', 'snapshotDate', 'windowDays'], { unique: true })
export class ScoreSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => StudentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  @Column({ name: 'snapshot_date', type: 'timestamptz' })
  snapshotDate: Date;

  @Column({ name: 'window_days', type: 'int' })
  windowDays: 7 | 30 | 90;

  @Column({ name: 'pld_pct', type: 'numeric', precision: 5, scale: 2, nullable: true }) pldPct: string | null;
  @Column({ name: 'exam_pct', type: 'numeric', precision: 5, scale: 2, nullable: true }) examPct: string | null;
  @Column({ name: 'task_pct', type: 'numeric', precision: 5, scale: 2, nullable: true }) taskPct: string | null;
  @Column({ name: 'attendance_pct', type: 'numeric', precision: 5, scale: 2, nullable: true }) attendancePct: string | null;
  @Column({ name: 'overall_score', type: 'numeric', precision: 5, scale: 2 }) overallScore: string;

  @Column({ name: 'risk_level', type: 'enum', enum: RiskLevel, enumName: 'risk_level_enum' })
  riskLevel: RiskLevel;

  @Column({ type: 'enum', enum: Trend, enumName: 'trend_enum' })
  trend: Trend;

  @Column({ name: 'computed_at', type: 'timestamptz', default: () => 'NOW()' })
  computedAt: Date;
}
