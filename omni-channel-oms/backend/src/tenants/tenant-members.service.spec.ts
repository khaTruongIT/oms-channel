import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { TenantMembersService } from './tenant-members.service';
import { UserTenantRole, UserRole } from '../database/entities/user-tenant-role.entity';
import { TenantInvite, InviteEmailStatus } from '../database/entities/tenant-invite.entity';
import { User } from '../database/entities/user.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { MailService } from '../mail/mail.service';

describe('TenantMembersService', () => {
  let service: TenantMembersService;
  let userTenantRoleRepo: any;
  let tenantInviteRepo: any;
  let userRepo: any;
  let tenantRepo: any;
  let mailService: any;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const ownerUserId = '11111111-1111-1111-1111-111111111111';
  const staffUserId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    userTenantRoleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn(async (entity) => entity),
      remove: jest.fn(async (entity) => entity),
    };

    tenantInviteRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 'invite-uuid-123' })),
      save: jest.fn(async (entity) => entity),
      remove: jest.fn(async (entity) => entity),
    };

    userRepo = {
      findOne: jest.fn(),
    };

    tenantRepo = {
      findOne: jest.fn(),
    };

    mailService = {
      getConfig: jest.fn(() => ({
        appUrl: 'https://app.omnichannel.vn',
        mailFrom: 'Omni OMS <onboarding@resend.dev>',
        isDevLogMode: false,
        isProduction: true,
      })),
      sendInviteEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantMembersService,
        {
          provide: getRepositoryToken(UserTenantRole),
          useValue: userTenantRoleRepo,
        },
        {
          provide: getRepositoryToken(TenantInvite),
          useValue: tenantInviteRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: tenantRepo,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
      ],
    }).compile();

    service = module.get<TenantMembersService>(TenantMembersService);
  });

  describe('getMembers (S3.2.6)', () => {
    it('maps fullName from full_name or falls back to first+last name, then email', async () => {
      userTenantRoleRepo.find.mockResolvedValueOnce([
        {
          user: {
            id: 'u1',
            email: 'alice@example.com',
            fullName: 'Alice Walker',
            firstName: 'Alice',
            lastName: 'Walker',
            createdAt: new Date('2026-01-01'),
          },
          role: UserRole.OWNER,
        },
        {
          user: {
            id: 'u2',
            email: 'bob@example.com',
            fullName: null,
            firstName: 'Bob',
            lastName: 'Marley',
            createdAt: new Date('2026-01-02'),
          },
          role: UserRole.SALES_STAFF,
        },
        {
          user: {
            id: 'u3',
            email: 'charlie@example.com',
            fullName: null,
            firstName: null,
            lastName: null,
            createdAt: new Date('2026-01-03'),
          },
          role: UserRole.WAREHOUSE_MANAGER,
        },
      ]);

      const members = await service.getMembers(tenantId);
      expect(members).toHaveLength(3);
      expect(members[0].fullName).toBe('Alice Walker');
      expect(members[1].fullName).toBe('Bob Marley');
      expect(members[2].fullName).toBe('charlie@example.com');
    });
  });

  describe('getPendingInvites (S3.2.5 Security)', () => {
    it('never exposes token (plain or hash) in response list', async () => {
      tenantInviteRepo.find.mockResolvedValueOnce([
        {
          id: 'inv-1',
          tenantId,
          email: 'invited@example.com',
          role: UserRole.SALES_STAFF,
          token: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // hashed in DB
          emailStatus: InviteEmailStatus.SENT,
          expiresAt: new Date(Date.now() + 100000),
          createdAt: new Date(),
        },
      ]);

      const list = await service.getPendingInvites(tenantId);
      expect(list).toHaveLength(1);
      expect((list[0] as any).token).toBeUndefined();
      expect(list[0].email).toBe('invited@example.com');
    });
  });

  describe('inviteMember (S3.2.3, S3.2.5)', () => {
    it('throws ForbiddenException if requester is not OWNER', async () => {
      userTenantRoleRepo.findOne.mockResolvedValueOnce({
        role: UserRole.SALES_STAFF,
      });

      await expect(
        service.inviteMember(tenantId, staffUserId, 'test@example.com', UserRole.SALES_STAFF),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates invite with SHA-256 hashed token, sends email, and records SENT on success', async () => {
      userTenantRoleRepo.findOne
        .mockResolvedValueOnce({ role: UserRole.OWNER }) // inviter role check
        .mockResolvedValueOnce(null); // not existing member
      userRepo.findOne.mockResolvedValueOnce(null); // user doesn't exist yet
      tenantInviteRepo.findOne.mockResolvedValueOnce(null); // no pending invite
      tenantRepo.findOne.mockResolvedValueOnce({ shopName: 'Mega Mart' });
      mailService.sendInviteEmail.mockResolvedValueOnce({ success: true, messageId: 'msg-1' });

      const response = await service.inviteMember(
        tenantId,
        ownerUserId,
        'newstaff@example.com',
        UserRole.SALES_STAFF,
      );

      // Verify stored token is a 64-char sha256 hex string
      const savedInvite = tenantInviteRepo.save.mock.calls[0][0];
      expect(savedInvite.token).toHaveLength(64);
      expect(savedInvite.token).not.toContain(response.inviteLink);

      // Verify email was sent with one-time plain link
      expect(mailService.sendInviteEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newstaff@example.com',
          tenantName: 'Mega Mart',
          inviteLink: expect.stringContaining('/invites/accept?token='),
        }),
      );

      expect(response.emailStatus).toBe(InviteEmailStatus.SENT);
      expect(response.emailSentAt).toBeDefined();
      expect(response.inviteLink).toBeDefined();
    });

    it('retains invite and marks EMAIL_FAILED if mail delivery fails (no rollback)', async () => {
      userTenantRoleRepo.findOne
        .mockResolvedValueOnce({ role: UserRole.OWNER })
        .mockResolvedValueOnce(null);
      userRepo.findOne.mockResolvedValueOnce(null);
      tenantInviteRepo.findOne.mockResolvedValueOnce(null);
      tenantRepo.findOne.mockResolvedValueOnce({ shopName: 'Mega Mart' });
      mailService.sendInviteEmail.mockResolvedValueOnce({
        success: false,
        error: 'SMTP timeout connection',
      });

      const response = await service.inviteMember(
        tenantId,
        ownerUserId,
        'newstaff@example.com',
        UserRole.SALES_STAFF,
      );

      expect(response.emailStatus).toBe(InviteEmailStatus.EMAIL_FAILED);
      expect(response.emailError).toBe('SMTP timeout connection');
      // Invite still successfully returned and saved in DB
      expect(tenantInviteRepo.save).toHaveBeenCalledTimes(2);
      expect(response.inviteLink).toBeDefined();
    });
  });

  describe('resendInvite (S3.2.4)', () => {
    it('throws ForbiddenException if requester is not OWNER', async () => {
      userTenantRoleRepo.findOne.mockResolvedValueOnce({
        role: UserRole.WAREHOUSE_MANAGER,
      });

      await expect(
        service.resendInvite(tenantId, staffUserId, 'invite-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if invite does not exist', async () => {
      userTenantRoleRepo.findOne.mockResolvedValueOnce({ role: UserRole.OWNER });
      tenantInviteRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.resendInvite(tenantId, ownerUserId, 'nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if invite has already been accepted', async () => {
      userTenantRoleRepo.findOne.mockResolvedValueOnce({ role: UserRole.OWNER });
      tenantInviteRepo.findOne.mockResolvedValueOnce({
        id: 'inv-1',
        acceptedAt: new Date(),
      });

      await expect(
        service.resendInvite(tenantId, ownerUserId, 'inv-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rotates token, extends expiry 7 days, resends mail, and returns one-time inviteLink', async () => {
      const oldTokenHash = 'old_sha256_hash_123456789012345678901234567890123456789012345678';
      const existingInvite = {
        id: 'inv-1',
        tenantId,
        email: 'colleague@example.com',
        role: UserRole.SALES_STAFF,
        token: oldTokenHash,
        expiresAt: new Date(Date.now() - 1000), // was expired
        emailStatus: InviteEmailStatus.EMAIL_FAILED,
        acceptedAt: null,
      };

      userTenantRoleRepo.findOne.mockResolvedValueOnce({ role: UserRole.OWNER });
      tenantInviteRepo.findOne.mockResolvedValueOnce(existingInvite);
      tenantRepo.findOne.mockResolvedValueOnce({ shopName: 'Mega Mart' });
      mailService.sendInviteEmail.mockResolvedValueOnce({ success: true, messageId: 'resend-1' });

      const result = await service.resendInvite(tenantId, ownerUserId, 'inv-1');

      expect(result.success).toBe(true);
      expect(result.emailStatus).toBe(InviteEmailStatus.SENT);
      expect(result.inviteLink).toBeDefined();

      // Check rotated token
      expect(existingInvite.token).not.toBe(oldTokenHash);
      expect(existingInvite.token).toHaveLength(64);
      // Check extended expiry > now + 6 days
      expect(existingInvite.expiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 3600 * 1000);
      expect(tenantInviteRepo.save).toHaveBeenCalledWith(existingInvite);
    });
  });

  describe('acceptInvite (S3.2.5)', () => {
    it('accepts valid invite by hashing plaintext token and matching DB hash', async () => {
      const plainToken = 'raw-user-invite-token-32-bytes-long';
      const expectedHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      const invite = {
        id: 'inv-1',
        tenantId,
        email: 'alice@example.com',
        role: UserRole.SALES_STAFF,
        token: expectedHash,
        expiresAt: new Date(Date.now() + 86400000),
        acceptedAt: null,
      };

      tenantInviteRepo.findOne.mockResolvedValueOnce(invite);
      userRepo.findOne.mockResolvedValueOnce({ id: 'u-alice', email: 'alice@example.com' });
      userTenantRoleRepo.findOne.mockResolvedValueOnce(null); // not yet member
      tenantRepo.findOne.mockResolvedValueOnce({ id: tenantId, shopName: 'Workspace 1' });

      const tenant = await service.acceptInvite(plainToken, 'u-alice');

      expect(tenant).toBeDefined();
      expect(userTenantRoleRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-alice',
          tenantId,
          role: UserRole.SALES_STAFF,
        }),
      );
      expect(invite.acceptedAt).toBeDefined();
    });

    it('rejects if token does not match any invite', async () => {
      tenantInviteRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.acceptInvite('invalid-token', 'u-alice'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects expired invite', async () => {
      const plainToken = 'expired-token';
      const expectedHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      tenantInviteRepo.findOne.mockResolvedValueOnce({
        token: expectedHash,
        expiresAt: new Date(Date.now() - 10000), // expired
        acceptedAt: null,
      });

      await expect(
        service.acceptInvite(plainToken, 'u-alice'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects if logged in user email does not match invite email', async () => {
      const plainToken = 'valid-token';
      const expectedHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      tenantInviteRepo.findOne.mockResolvedValueOnce({
        token: expectedHash,
        email: 'alice@example.com',
        expiresAt: new Date(Date.now() + 86400000),
        acceptedAt: null,
      });
      userRepo.findOne.mockResolvedValueOnce({ id: 'u-bob', email: 'bob@example.com' });

      await expect(
        service.acceptInvite(plainToken, 'u-bob'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
