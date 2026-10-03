import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChannelAccountDto {
  @IsNotEmpty()
  @IsString()
  shopId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  shopName?: string;

  /**
   * The opaque credential payload is encrypted before persistence. It is not
   * accepted by the response DTO and never emitted in API responses.
   */
  @IsOptional()
  @IsString()
  credentials?: string;
}
