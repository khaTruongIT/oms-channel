import { resolveMailConfig } from './mail.config';

describe('mail.config', () => {
  it('resolves defaults in development mode when RESEND_API_KEY is omitted', () => {
    const config = resolveMailConfig({
      NODE_ENV: 'development',
    });

    expect(config.isDevLogMode).toBe(true);
    expect(config.isProduction).toBe(false);
    expect(config.resendApiKey).toBeUndefined();
    expect(config.mailFrom).toBe('Omni OMS <onboarding@resend.dev>');
    expect(config.appUrl).toBe('http://localhost:3000');
  });

  it('normalizes app URL by trimming trailing slashes', () => {
    const config = resolveMailConfig({
      NODE_ENV: 'development',
      APP_URL: 'https://app.omnichannel.vn///',
    });

    expect(config.appUrl).toBe('https://app.omnichannel.vn');
  });

  it('resolves valid configuration with RESEND_API_KEY and custom MAIL_FROM', () => {
    const config = resolveMailConfig({
      NODE_ENV: 'production',
      RESEND_API_KEY: 're_123456789',
      MAIL_FROM: 'Omni Team <noreply@omnichannel.vn>',
      APP_URL: 'https://oms.example.com',
    });

    expect(config.isDevLogMode).toBe(false);
    expect(config.isProduction).toBe(true);
    expect(config.resendApiKey).toBe('re_123456789');
    expect(config.mailFrom).toBe('Omni Team <noreply@omnichannel.vn>');
    expect(config.appUrl).toBe('https://oms.example.com');
  });

  it('fails fast when RESEND_API_KEY is missing in production', () => {
    expect(() =>
      resolveMailConfig({
        NODE_ENV: 'production',
      }),
    ).toThrow('RESEND_API_KEY is required in production');
  });

  it('fails fast when RESEND_API_KEY is whitespace only in production', () => {
    expect(() =>
      resolveMailConfig({
        NODE_ENV: 'production',
        RESEND_API_KEY: '   ',
      }),
    ).toThrow('RESEND_API_KEY is required in production');
  });
});
