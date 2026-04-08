import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../common/enums/roles.enum';

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

@Entity('users')
@Index('ux_users_email', ['email'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, enumName: 'user_role_enum' })
  role: Role;

  @Column({ type: 'enum', enum: UserStatus, enumName: 'user_status_enum', default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
