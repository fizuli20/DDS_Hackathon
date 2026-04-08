import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

export enum ImportType {
  STUDENTS = 'students',
  PLD = 'pld',
  EXAMS = 'exams',
  TASKS = 'tasks',
  ATTENDANCE = 'attendance',
}
export enum ImportSource {
  UPLOAD = 'upload',
  SYNC = 'sync',
}
export enum ImportStatus {
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

@Entity('imports')
@Index('ix_imports_created_at', ['createdAt'])
export class ImportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ImportType, enumName: 'import_type_enum' }) type: ImportType;
  @Column({ type: 'enum', enum: ImportSource, enumName: 'import_source_enum' }) source: ImportSource;
  @Column({ type: 'enum', enum: ImportStatus, enumName: 'import_status_enum', default: ImportStatus.RUNNING }) status: ImportStatus;
  @Column({ name: 'started_at', type: 'timestamptz', default: () => 'NOW()' }) startedAt: Date;
  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true }) finishedAt: Date | null;
  @Column({ type: 'jsonb', nullable: true }) stats: Record<string, unknown> | null;
  @Column({ name: 'error_sample', type: 'jsonb', nullable: true }) errorSample: Record<string, unknown> | null;
  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true }) createdByUserId: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
