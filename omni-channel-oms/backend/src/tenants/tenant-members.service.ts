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
import { TenantInvite } from '../database/entities/tenant-invite.entity';
import { User } from '../database/entities/user.entity';
import { Tenant } from '../database/entities/tenant.entity';

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
  ) {}

  async getMembers(tenantId: string): Promise<any[]> {
    const members = await this.userTenantRoleRepository.find({
      where: { tenantId },
      relations: ['user'],
    });

    return members.map((member) => ({
      id: member.user.id,
      email: member.user.email,
      fullName: member.user.email, // TODO: Add fullName to User entity
      role: member.role,
      joinedAt: member.user.createdAt, // Or create a joinedAt in UserTenantRole if needed
    }));
  }

  async getPendingInvites(tenantId: string): Promise<TenantInvite[]> {
    return this.tenantInviteRepository.find({
      where: {
        tenantId,
        acceptedAt: null, // Only show unaccepted invites
        expiresAt: MoreThan(new Date()), // Only show non-expired invites
      } as any, // TypeORM strict typings sometimes complain about null checks
      order: { createdAt: 'DESC' },
    });
  }

  async inviteMember(
    tenantId: string,
    invitedByUserId: string,
    email: string,
    role: UserRole,
  ): Promise<TenantInvite> {
    // Check if inviter is OWNER or MANAGER (assuming managers can invite)
    const inviterRole = await this.userTenantRoleRepository.findOne({
      where: { tenantId, userId: invitedByUserId },
    });

    if (!inviterRole || inviterRole.role !== UserRole.OWNER) {
      // Only OWNER can invite for now to be safe, or check permissions
      throw new ForbiddenException('Only owners can invite new members');
    }

    // Check if user is already a member
    const existingUser = await this.userRepository.findOne({
      where: { email },
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
        email,
        acceptedAt: null,
        expiresAt: MoreThan(new Date()),
      } as any,
    });

    if (existingInvite) {
      throw new BadRequestException(
        'Pending invite already exists for this email',
      );
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invite = this.tenantInviteRepository.create({
      tenantId,
      email,
      role,
      invitedBy: invitedByUserId,
      token,
      expiresAt,
    });

    await this.tenantInviteRepository.save(invite);

    // TODO: Send email with invite link (token)
    // For now, return the token/invite
    return invite;
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
    const invite = await this.tenantInviteRepository.findOne({
      where: { token, acceptedAt: null } as any,
    });

    if (!invite) {
      throw new NotFoundException('Invalid or expired invite token');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired');
    }

    // Verify user email matches invite email (optional, but good for security)
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.email !== invite.email) {
      throw new BadRequestException(
        'Invite email does not match logged in user',
      );
    }

    // Check if already member
    const existingRole = await this.userTenantRoleRepository.findOne({
      where: { tenantId: invite.tenantId, userId },
    });

    if (existingRole) {
      // Already member, just mark accepted
      invite.acceptedAt = new Date();
      await this.tenantInviteRepository.save(invite);
      return this.tenantRepository.findOne({
        where: { id: invite.tenantId },
      }) as Promise<Tenant>;
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
