export type RuntimeEnv = Readonly<Record<string, string | undefined>>;

export interface MailConfig {
  resendApiKey?: string;
  mailFrom: string;
  appUrl: string;
  isDevLogMode: boolean;
  isProduction: boolean;
}

const DEFAULT_MAIL_FROM = 'Omni OMS <onboarding@resend.dev>';
const DEFAULT_APP_URL = 'http://localhost:3000';

export function resolveMailConfig(env: RuntimeEnv = process.env): MailConfig {
  const nodeEnv = env.NODE_ENV?.trim() || 'development';
  const isProduction = nodeEnv === 'production';
  const resendApiKey = env.RESEND_API_KEY?.trim() || undefined;
  const mailFrom = env.MAIL_FROM?.trim() || DEFAULT_MAIL_FROM;
  const rawAppUrl = env.APP_URL?.trim() || DEFAULT_APP_URL;
  const appUrl = rawAppUrl.replace(/\/+$/, '');

  if (isProduction && !resendApiKey) {
    throw new Error('RESEND_API_KEY is required in production');
  }

  const isDevLogMode = !resendApiKey;

  return {
    resendApiKey,
    mailFrom,
    appUrl,
    isDevLogMode,
    isProduction,
  };
}
