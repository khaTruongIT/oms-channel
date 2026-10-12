import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('InviteEmailStatusUserFullName migration', () => {
  const source = readFileSync(
    join(__dirname, '1706610000000-InviteEmailStatusUserFullName.ts'),
    'utf8',
  );

  it('adds email_status, email_sent_at, and email_error to tenant_invites', () => {
    expect(source).toContain('email_status');
    expect(source).toContain('email_sent_at');
    expect(source).toContain('email_error');
    expect(source).toContain('character varying(20) NOT NULL DEFAULT \'PENDING\'');
  });

  it('adds full_name column to users', () => {
    expect(source).toContain('full_name');
    expect(source).toContain('ALTER TABLE "public"."users"');
  });

  it('hashes existing pending tokens using sha256 via pgcrypto', () => {
    expect(source).toContain('encode(digest("token", \'sha256\'), \'hex\')');
    expect(source).toContain('WHERE "accepted_at" IS NULL');
  });

  it('creates token and tenant-email indexes on tenant_invites', () => {
    expect(source).toContain('idx_tenant_invites_token');
    expect(source).toContain('idx_tenant_invites_tenant_email');
  });

  it('provides a clean down rollback path', () => {
    expect(source).toContain('DROP INDEX IF EXISTS "public"."idx_tenant_invites_tenant_email"');
    expect(source).toContain('DROP INDEX IF EXISTS "public"."idx_tenant_invites_token"');
    expect(source).toContain('ALTER TABLE "public"."users" \n      DROP COLUMN IF EXISTS "full_name"');
    expect(source).toContain('DROP COLUMN IF EXISTS "email_status"');
  });
});
