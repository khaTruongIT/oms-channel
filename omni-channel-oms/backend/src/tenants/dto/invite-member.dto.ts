import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../database/entities/user-tenant-role.entity';

export class InviteMemberDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email to invite' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SALES_STAFF })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
