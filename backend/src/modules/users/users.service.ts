import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/roles.enum';
import { UserEntity, UserStatus } from '../../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  findAll() {
    return this.usersRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async findActiveById(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user || user.status !== UserStatus.ACTIVE) return null;
    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  async createUser(data: {
    email: string;
    password: string;
    role: Role;
    emailVerified?: boolean;
  }) {
    const email = data.email.trim().toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered.');
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = this.usersRepo.create({
      email,
      passwordHash,
      role: data.role,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: data.emailVerified ? new Date() : null,
      verificationToken: null,
      verificationTokenExpires: null,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
    return this.usersRepo.save(user);
  }

  async setPassword(userId: string, plainPassword: string) {
    const passwordHash = await bcrypt.hash(plainPassword, 12);
    await this.usersRepo.update({ id: userId }, { passwordHash });
  }

  async validatePassword(user: UserEntity, plainPassword: string) {
    return bcrypt.compare(plainPassword, user.passwordHash);
  }

  async updateVerificationToken(userId: string, token: string | null, expires: Date | null) {
    await this.usersRepo.update(
      { id: userId },
      { verificationToken: token, verificationTokenExpires: expires },
    );
  }

  async verifyEmailByToken(token: string) {
    const user = await this.usersRepo.findOne({ where: { verificationToken: token } });
    if (!user || !user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
      throw new ConflictException('Invalid or expired verification token.');
    }
    await this.usersRepo.update(
      { id: user.id },
      {
        emailVerifiedAt: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
      },
    );
    return this.findById(user.id);
  }

  async setResetToken(email: string, token: string, expires: Date) {
    await this.usersRepo.update(
      { email: email.trim().toLowerCase() },
      { resetPasswordToken: token, resetPasswordExpires: expires },
    );
  }

  async findByResetToken(token: string) {
    return this.usersRepo.findOne({ where: { resetPasswordToken: token } });
  }

  async clearResetToken(userId: string) {
    await this.usersRepo.update(
      { id: userId },
      { resetPasswordToken: null, resetPasswordExpires: null },
    );
  }
}
