import { Injectable, Logger, Optional } from '@nestjs/common';
import { Resend } from 'resend';
import { resolveMailConfig } from '../config/mail.config';
import type { MailConfig } from '../config/mail.config';

export interface SendInviteEmailOptions {
  to: string;
  tenantName: string;
  inviteLink: string;
  role: string;
}

export interface MailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function sanitizeMailError(error: unknown): string {
  if (!error) return 'Unknown email delivery error';
  const rawMessage =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);

  return rawMessage
    .replace(/re_[a-zA-Z0-9_-]+/g, 're_***REDACTED***')
    .slice(0, 500);
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly config: MailConfig;
  private readonly resendClient?: Resend;

  constructor(@Optional() customConfig?: MailConfig) {
    this.config = customConfig || resolveMailConfig();

    if (this.config.resendApiKey) {
      this.resendClient = new Resend(this.config.resendApiKey);
    }
  }

  getConfig(): MailConfig {
    return this.config;
  }

  async sendInviteEmail(
    options: SendInviteEmailOptions,
  ): Promise<MailDeliveryResult> {
    const { to, tenantName, inviteLink, role } = options;

    if (this.config.isDevLogMode || !this.resendClient) {
      this.logger.log(
        `[DEV MAIL LOG] To: ${to} | Workspace: "${tenantName}" | Role: ${role} | Invite Link: ${inviteLink}`,
      );
      return {
        success: true,
        messageId: `dev-log-${Date.now()}`,
      };
    }

    try {
      const subject = `Lời mời tham gia workspace ${tenantName} trên Omni OMS`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 8px; background-color: #FFFFFF;">
          <h2 style="color: #0F172A; margin-top: 0;">Lời mời tham gia ${tenantName}</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.5;">
            Bạn đã được mời tham gia tổ chức <strong>${tenantName}</strong> trên hệ thống Omni-Channel OMS với vai trò <strong>${role}</strong>.
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${inviteLink}" style="background-color: #0369A1; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Chấp nhận lời mời
            </a>
          </div>
          <p style="color: #64748B; font-size: 13px; line-height: 1.4;">
            Hoặc sao chép liên kết này vào trình duyệt:<br />
            <a href="${inviteLink}" style="color: #0369A1; word-break: break-all;">${inviteLink}</a>
          </p>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; border-top: 1px solid #F1F5F9; padding-top: 16px;">
            Liên kết này có hiệu lực trong vòng 7 ngày. Nếu bạn không yêu cầu lời mời này, vui lòng bỏ qua email.
          </p>
        </div>
      `;

      const response = await this.resendClient.emails.send({
        from: this.config.mailFrom,
        to,
        subject,
        html,
      });

      if (response.error) {
        const sanitized = sanitizeMailError(response.error);
        this.logger.error(`Resend delivery failed for ${to}: ${sanitized}`);
        return {
          success: false,
          error: sanitized,
        };
      }

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (err) {
      const sanitized = sanitizeMailError(err);
      this.logger.error(`Exception while sending email to ${to}: ${sanitized}`);
      return {
        success: false,
        error: sanitized,
      };
    }
  }
}
