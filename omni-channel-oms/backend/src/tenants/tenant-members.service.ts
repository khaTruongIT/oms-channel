import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import {
  UserTenantRole,
  UserRole,
} from '../database/entities/user-tenant-role.entity';
import {
  TenantInvite,
  InviteEmailStatus,
} from '../database/entities/tenant-invite.entity';
import { User } from '../database/entities/user.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { MailService } from '../mail/mail.service';

export interface InviteMemberResponse extends Omit<TenantInvite, 'token'> {
  inviteLink: string;
}

export interface ResendInviteResponse {
  success: boolean;
  inviteLink: string;
  emailStatus: InviteEmailStatus;
  emailError?: string;
}

@Injectable()
export class TenantMembersService {
  constructor(
    @InjectRepository(UserTenantRole)
    private readonly userTenantRoleRepository: Repository<UserTenantRole>,
    @InjectRepository(TenantInvite)
    private readonly tenantInviteRepository: Repository<TenantInvite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly mailService: MailService,
  ) {}

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
  }

  async getMembers(tenantId: string): Promise<any[]> {
    const members = await this.userTenantRoleRepository.find({
      where: { tenantId },
      relations: ['user'],
    });

    return members.map((member) => ({
      id: member.user.id,
      email: member.user.email,
      fullName:
        member.user.fullName ||
        [member.user.firstName, member.user.lastName].filter(Boolean).join(' ') ||
        member.user.email,
      role: member.role,
      joinedAt: member.user.createdAt,
    }));
  }

  async getPendingInvites(tenantId: string): Promise<Omit<TenantInvite, 'token'>[]> {
    const invites = await this.tenantInviteRepository.find({
      where: {
        tenantId,
        acceptedAt: null,
        expiresAt: MoreThan(new Date()),
      } as any,
      order: { createdAt: 'DESC' },
    });

    // Security (S3.2.5): Never expose plain or hashed invite token in list API
    return invites.map((invite) => {
      const { token: omittedToken, ...safeInvite } = invite;
      void omittedToken;
      return safeInvite;
    });
  }

  async inviteMember(
    tenantId: string,
    invitedByUserId: string,
    email: string,
    role: UserRole,
  ): Promise<InviteMemberResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if inviter is OWNER
    const inviterRole = await this.userTenantRoleRepository.findOne({
      where: { tenantId, userId: invitedByUserId },
    });

    if (!inviterRole || inviterRole.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can invite new members');
    }

    // Check if user is already a member
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      const isMember = await this.userTenantRoleRepository.findOne({
        where: { tenantId, userId: existingUser.id },
      });
      if (isMember) {
        throw new BadRequestException(
          'User is already a member of this tenant',
        );
      }
    }

    // Check if valid pending invite exists
    const existingInvite = await this.tenantInviteRepository.findOne({
      where: {
        tenantId,
        email: normalizedEmail,
        acceptedAt: null,
        expiresAt: MoreThan(new Date()),
      } as any,
    });

    if (existingInvite) {
      throw new BadRequestException(
        'Pending invite already exists for this email',
      );
    }

    // Generate token and store its SHA-256 hash (S3.2.5)
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(plainToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invite = this.tenantInviteRepository.create({
      tenantId,
      email: normalizedEmail,
      role,
      invitedBy: invitedByUserId,
      token: tokenHash,
      emailStatus: InviteEmailStatus.PENDING,
      expiresAt,
    });

    await this.tenantInviteRepository.save(invite);

    // Retrieve tenant name for professional invite email
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    const tenantName = tenant?.shopName || 'Workspace';

    const appUrl = this.mailService.getConfig().appUrl;
    const inviteLink = `${appUrl}/invites/accept?token=${plainToken}`;

    // S3.2.3: Send email; do NOT rollback invite on email delivery failure
    const mailResult = await this.mailService.sendInviteEmail({
      to: normalizedEmail,
      tenantName,
      inviteLink,
      role,
    });

    if (mailResult.success) {
      invite.emailStatus = InviteEmailStatus.SENT;
      invite.emailSentAt = new Date();
      invite.emailError = undefined;
    } else {
      invite.emailStatus = InviteEmailStatus.EMAIL_FAILED;
      invite.emailError = mailResult.error || 'Failed to deliver email';
    }

    await this.tenantInviteRepository.save(invite);

    const { token: omittedToken, ...safeInvite } = invite;
    void omittedToken;

    return {
      ...safeInvite,
      inviteLink,
    };
  }

  async resendInvite(
    tenantId: string,
    requestedByUserId: string,
    inviteId: string,
  ): Promise<ResendInviteResponse> {
    const requesterRole = await this.userTenantRoleRepository.findOne({
      where: { tenantId, userId: requestedByUserId },
    });

    if (!requesterRole || requesterRole.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can resend invites');
    }

    const invite = await this.tenantInviteRepository.findOne({
      where: { id: inviteId, tenantId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.acceptedAt) {
      throw new BadRequestException('Invite has already been accepted');
    }

    // S3.2.4: Rotate token, invalidate old token, extend 7 days
    const newPlainToken = crypto.randomBytes(32).toString('hex');
    invite.token = this.hashToken(newPlainToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    invite.expiresAt = expiresAt;

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    const tenantName = tenant?.shopName || 'Workspace';
    const appUrl = this.mailService.getConfig().appUrl;
    const inviteLink = `${appUrl}/invites/accept?token=${newPlainToken}`;

    const mailResult = await this.mailService.sendInviteEmail({
      to: invite.email,
      tenantName,
      inviteLink,
      role: invite.role,
    });

    if (mailResult.success) {
      invite.emailStatus = InviteEmailStatus.SENT;
      invite.emailSentAt = new Date();
      invite.emailError = undefined;
    } else {
      invite.emailStatus = InviteEmailStatus.EMAIL_FAILED;
      invite.emailError = mailResult.error || 'Failed to deliver email';
    }

    await this.tenantInviteRepository.save(invite);

    return {
      success: true,
      inviteLink,
      emailStatus: invite.emailStatus,
      emailError: invite.emailError,
    };
  }

  async removeMember(
    tenantId: string,
    requestedByUserId: string,
    memberUserId: string,
  ): Promise<void> {
    const requesterRole = await this.userTenantRoleRepository.findOne({
      where: { tenantId, userId: requestedByUserId },
    });

    if (!requesterRole || requesterRole.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can remove members');
    }

    const memberRole = await this.userTenantRoleRepository.findOne({
      where: { tenantId, userId: memberUserId },
    });

    if (!memberRole) {
      throw new NotFoundException('Member not found');
    }

    if (memberRole.role === UserRole.OWNER) {
      throw new BadRequestException('Cannot remove the owner');
    }

    await this.userTenantRoleRepository.remove(memberRole);
  }

  async updateMemberRole(
    tenantId: string,
    requestedByUserId: string,
    memberUserId: string,
    newRole: UserRole,
  ): Promise<void> {
    const requesterRole = await this.userTenantRoleRepository.findOne({
      where: { tenantId, userId: requestedByUserId },
    });

    if (!requesterRole || requesterRole.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can update member roles');
    }

    const memberRole = await this.userTenantRoleRepository.findOne({
      where: { tenantId, userId: memberUserId },
    });

    if (!memberRole) {
      throw new NotFoundException('Member not found');
    }

    if (memberRole.role === UserRole.OWNER) {
      throw new BadRequestException('Cannot change role of the owner');
    }

    memberRole.role = newRole;
    await this.userTenantRoleRepository.save(memberRole);
  }

  async cancelInvite(
    tenantId: string,
    requestedByUserId: string,
    inviteId: string,
  ): Promise<void> {
    const requesterRole = await this.userTenantRoleRepository.findOne({
      where: { tenantId, userId: requestedByUserId },
    });

    if (!requesterRole || requesterRole.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can cancel invites');
    }

    const invite = await this.tenantInviteRepository.findOne({
      where: { id: inviteId, tenantId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    await this.tenantInviteRepository.remove(invite);
  }

  async acceptInvite(token: string, userId: string): Promise<Tenant> {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Invite token is required');
    }

    // S3.2.5: Lookup invite by SHA-256 hash
    const tokenHash = this.hashToken(token);

    const invite = await this.tenantInviteRepository.findOne({
      where: { token: tokenHash, acceptedAt: null } as any,
    });

    if (!invite) {
      throw new NotFoundException('Invalid or expired invite token');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired');
    }

    // Verify user email matches invite email
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new BadRequestException(
        'Invite email does not match logged in user',
      );
    }

    // Check if already member
    const existingRole = await this.userTenantRoleRepository.findOne({
      where: { tenantId: invite.tenantId, userId },
    });

    if (existingRole) {
      invite.acceptedAt = new Date();
      await this.tenantInviteRepository.save(invite);
      const tenant = await this.tenantRepository.findOne({
        where: { id: invite.tenantId },
      });
      if (!tenant) throw new NotFoundException('Tenant not found');
      return tenant;
    }

    // Add to tenant
    const userTenantRole = this.userTenantRoleRepository.create({
      userId,
      tenantId: invite.tenantId,
      role: invite.role,
    });

    await this.userTenantRoleRepository.save(userTenantRole);

    // Mark accepted
    invite.acceptedAt = new Date();
    await this.tenantInviteRepository.save(invite);

    const tenant = await this.tenantRepository.findOne({
      where: { id: invite.tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return tenant;
  }
}
