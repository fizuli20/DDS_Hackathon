import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { Role } from '../../common/enums/roles.enum';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.config.get<string>('ADMIN_EMAIL');
    const pass = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !pass) return;
    const existing = await this.usersService.findByEmail(email);
    if (!existing) {
      await this.usersService.createUser({
        email,
        password: pass,
        role: Role.ADMIN,
        emailVerified: true,
      });
    }
  }

  private signToken(userId: string, email: string, role: Role) {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }

  async register(dto: { email: string; password: string }) {
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const user = await this.usersService.createUser({
      email: dto.email,
      password: dto.password,
      role: Role.STUDENT,
      emailVerified: false,
    });
    await this.usersService.updateVerificationToken(user.id, token, expires);
    await this.mailService.sendVerificationEmail(user.email, token);
    await this.auditService.log(null, 'auth.register', 'user', user.id, { email: user.email });
    return {
      message: 'Registration successful. Check your email to verify your account.',
      userId: user.id,
    };
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const ok = await this.usersService.validatePassword(user, dto.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const accessToken = this.signToken(user.id, user.email, user.role);
    await this.auditService.log(user.id, 'auth.login', 'user', user.id, {});
    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: !!user.emailVerifiedAt,
      },
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.verifyEmailByToken(token);
    await this.auditService.log(user.id, 'auth.verify_email', 'user', user.id, {});
    return { ok: true, email: user.email };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If the email exists, a reset link was sent.' };
    }
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await this.usersService.setResetToken(user.email, token, expires);
    await this.mailService.sendPasswordResetEmail(user.email, token);
    await this.auditService.log(user.id, 'auth.forgot_password', 'user', user.id, {});
    return { message: 'If the email exists, a reset link was sent.' };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token.');
    }
    await this.usersService.setPassword(user.id, password);
    await this.usersService.clearResetToken(user.id);
    await this.auditService.log(user.id, 'auth.reset_password', 'user', user.id, {});
    return { ok: true };
  }
}
