import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';

export class CreateTenantsDto {
  @ApiProperty({
    description: 'Array of tenants to create',
    type: [CreateTenantDto],
    example: [
      { shopName: 'Shop 1', contactEmail: 'shop1@example.com' },
      { shopName: 'Shop 2', contactEmail: 'shop2@example.com' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one tenant is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateTenantDto)
  tenants: CreateTenantDto[];
}
