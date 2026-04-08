import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DataSourceEntity } from './data-source.entity';

@Entity('data_source_records')
@Index('ix_source_records_source_row', ['sourceId', 'rowIndex'], { unique: true })
export class DataSourceRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_id', type: 'uuid' })
  sourceId: string;

  @ManyToOne(() => DataSourceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source: DataSourceEntity;

  @Column({ name: 'row_index', type: 'int' })
  rowIndex: number;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
