import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Track } from '../../common/enums/roles.enum';
import { CohortEntity } from './cohort.entity';
import { UserEntity } from './user.entity';

export enum StudentStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DROPPED_OUT = 'dropped_out',
}

@Entity('students')
@Check(`"student_id" ~ '^HB-[0-9]{4}-[0-9]{3}$'`)
@Index('ix_students_cohort_track_status', ['cohortId', 'track', 'status'])
export class StudentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id', type: 'text', unique: true })
  studentId: string;

  @Column({ name: 'first_name', type: 'text' })
  firstName: string;

  @Column({ name: 'last_name', type: 'text' })
  lastName: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'enum', enum: Track, enumName: 'track_enum' })
  track: Track;

  @Column({ name: 'cohort_id', type: 'uuid', nullable: true })
  cohortId: string | null;

  @ManyToOne(() => CohortEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cohort_id' })
  cohort: CohortEntity | null;

  @Column({ name: 'mentor_user_id', type: 'uuid', nullable: true })
  mentorUserId: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mentor_user_id' })
  mentor: UserEntity | null;

  @Column({ type: 'enum', enum: StudentStatus, enumName: 'student_status_enum', default: StudentStatus.ACTIVE })
  status: StudentStatus;

  @Column({ name: 'enrollment_date', type: 'timestamptz', nullable: true })
  enrollmentDate: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
