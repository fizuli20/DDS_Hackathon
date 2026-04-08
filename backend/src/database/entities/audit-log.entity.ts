import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('audit_logs')
@Index('ix_audit_logs_actor_created_at', ['actorUserId', 'createdAt'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actor: UserEntity | null;

  @Column({ type: 'text' }) action: string;
  @Column({ name: 'target_type', type: 'text', nullable: true }) targetType: string | null;
  @Column({ name: 'target_id', type: 'uuid', nullable: true }) targetId: string | null;
  @Column({ type: 'jsonb', nullable: true }) diff: Record<string, unknown> | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
