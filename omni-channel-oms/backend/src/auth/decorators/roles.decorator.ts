import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../database/entities/user-tenant-role.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
