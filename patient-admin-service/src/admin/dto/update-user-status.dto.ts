import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'New status: active | inactive | suspended' })
  @IsNotEmpty()
  @IsIn(['active', 'inactive', 'suspended'])
  status: UserStatus;

  @ApiProperty({ description: 'Optional admin note explaining the status change' })
  @IsOptional()
  @IsString()
  note?: string;
}
