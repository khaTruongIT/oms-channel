import { MailService } from './mail.service';
import { MailConfig } from '../config/mail.config';

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation((apiKey: string) => {
      return {
        apiKey,
        emails: {
          send: jest.fn(),
        },
      };
    }),
  };
});

describe('MailService', () => {
  const devConfig: MailConfig = {
    resendApiKey: undefined,
    mailFrom: 'Omni OMS <onboarding@resend.dev>',
    appUrl: 'http://localhost:3000',
    isDevLogMode: true,
    isProduction: false,
  };

  const prodConfig: MailConfig = {
    resendApiKey: 're_valid_prod_key_123',
    mailFrom: 'Omni OMS <noreply@omnichannel.vn>',
    appUrl: 'https://app.omnichannel.vn',
    isDevLogMode: false,
    isProduction: true,
  };

  it('logs invite link in dev log mode and returns success without calling network', async () => {
    const service = new MailService(devConfig);
    const result = await service.sendInviteEmail({
      to: 'member@example.com',
      tenantName: 'Acme Corp',
      inviteLink: 'http://localhost:3000/invites/accept?token=plain-token-123',
      role: 'SALES_STAFF',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toContain('dev-log-');
    expect(result.error).toBeUndefined();
  });

  it('sends email successfully via Resend client in production mode', async () => {
    const service = new MailService(prodConfig);
    const mockSend = (service as any).resendClient.emails.send as jest.Mock;
    mockSend.mockResolvedValueOnce({
      data: { id: 'email_msg_98765' },
      error: null,
    });

    const result = await service.sendInviteEmail({
      to: 'manager@example.com',
      tenantName: 'Alpha Warehouse',
      inviteLink: 'https://app.omnichannel.vn/invites/accept?token=secret123',
      role: 'WAREHOUSE_MANAGER',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('email_msg_98765');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Omni OMS <noreply@omnichannel.vn>',
        to: 'manager@example.com',
      }),
    );
  });

  it('handles Resend API error response without throwing unhandled exceptions', async () => {
    const service = new MailService(prodConfig);
    const mockSend = (service as any).resendClient.emails.send as jest.Mock;
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'Domain not verified for re_valid_prod_key_123' },
    });

    const result = await service.sendInviteEmail({
      to: 'manager@example.com',
      tenantName: 'Alpha Warehouse',
      inviteLink: 'https://app.omnichannel.vn/invites/accept?token=secret123',
      role: 'WAREHOUSE_MANAGER',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Domain not verified');
    expect(result.error).not.toContain('re_valid_prod_key_123'); // API key must be sanitized!
    expect(result.error).toContain('re_***REDACTED***');
  });

  it('handles unexpected network exception without crashing', async () => {
    const service = new MailService(prodConfig);
    const mockSend = (service as any).resendClient.emails.send as jest.Mock;
    mockSend.mockRejectedValueOnce(new Error('Connection timeout to api.resend.com with re_key_secret'));

    const result = await service.sendInviteEmail({
      to: 'manager@example.com',
      tenantName: 'Alpha Warehouse',
      inviteLink: 'https://app.omnichannel.vn/invites/accept?token=secret123',
      role: 'WAREHOUSE_MANAGER',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Connection timeout');
    expect(result.error).toContain('re_***REDACTED***');
  });
});
