import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../database/entities/user-tenant-role.entity';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.WAREHOUSE_MANAGER })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
