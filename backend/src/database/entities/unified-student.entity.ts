import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('unified_students')
@Index('ix_unified_students_merge_key', ['mergeKey'], { unique: true })
@Index('ix_unified_students_cohort', ['cohort'])
export class UnifiedStudentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merge_key', type: 'text' })
  mergeKey: string;

  @Column({ name: 'student_id', type: 'text', nullable: true })
  studentId: string | null;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  cohort: string | null;

  @Column({ type: 'float', nullable: true })
  pld: number | null;

  @Column({ type: 'float', nullable: true })
  task: number | null;

  @Column({ type: 'float', nullable: true })
  exam: number | null;

  @Column({ type: 'float', nullable: true })
  attendance: number | null;

  @Column({ type: 'float', nullable: true })
  overall: number | null;

  @Column({ name: 'source_priority', type: 'int', default: 1000 })
  sourcePriority: number;

  @Column({ name: 'last_source_type', type: 'text', nullable: true })
  lastSourceType: string | null;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
