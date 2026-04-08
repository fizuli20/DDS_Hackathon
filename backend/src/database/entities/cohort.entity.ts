import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Track } from '../../common/enums/roles.enum';

export enum CohortStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Entity('cohorts')
export class CohortEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string;

  @Column({ type: 'enum', enum: Track, enumName: 'track_enum' })
  track: Track;

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ type: 'enum', enum: CohortStatus, enumName: 'cohort_status_enum', default: CohortStatus.ACTIVE })
  status: CohortStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
