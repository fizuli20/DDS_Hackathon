import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StudentEntity } from './student.entity';
import { UserEntity } from './user.entity';

export enum NotificationChannel {
  EMAIL = 'email',
  TELEGRAM = 'telegram',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('notification_logs')
@Index('ix_notification_logs_student_created_at', ['studentId', 'createdAt'])
export class NotificationLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id', type: 'uuid', nullable: true })
  studentId: string | null;

  @ManyToOne(() => StudentEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity | null;

  @Column({ name: 'recipient_user_id', type: 'uuid', nullable: true })
  recipientUserId: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recipient_user_id' })
  recipientUser: UserEntity | null;

  @Column({ type: 'enum', enum: NotificationChannel, enumName: 'notification_channel_enum' })
  channel: NotificationChannel;
  @Column({ name: 'template_key', type: 'text', nullable: true }) templateKey: string | null;
  @Column({ type: 'text', nullable: true }) subject: string | null;
  @Column({ type: 'text', nullable: true }) body: string | null;
  @Column({ type: 'enum', enum: NotificationStatus, enumName: 'notification_status_enum', default: NotificationStatus.PENDING })
  status: NotificationStatus;
  @Column({ name: 'provider_message_id', type: 'text', nullable: true }) providerMessageId: string | null;
  @Column({ type: 'text', nullable: true }) error: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true }) sentAt: Date | null;
}
