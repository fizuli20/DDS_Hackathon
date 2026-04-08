import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<string>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      });
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const base = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const url = `${base}/verify-email?token=${encodeURIComponent(token)}`;
    const subject = 'Verify your HSPTS account';
    const text = `Open this link to verify your email:\n${url}`;
    await this.send(to, subject, text, url);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const base = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const url = `${base}/reset-password?token=${encodeURIComponent(token)}`;
    const subject = 'Reset your HSPTS password';
    const text = `Open this link to set a new password (valid 1 hour):\n${url}`;
    await this.send(to, subject, text, url);
  }

  private async send(to: string, subject: string, text: string, linkUrl: string) {
    const from = this.config.get<string>('SMTP_FROM') || 'noreply@hspts.local';
    if (this.transporter) {
      await this.transporter.sendMail({ from, to, subject, text, html: `<p>${text.replace(/\n/g, '<br/>')}</p><p><a href="${linkUrl}">${linkUrl}</a></p>` });
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return;
    }
    this.logger.warn(`SMTP not configured. Email to ${to} — ${subject}\n${linkUrl}`);
  }
}
