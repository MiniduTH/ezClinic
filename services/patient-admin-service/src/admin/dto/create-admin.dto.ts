import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAdminDto {
  @ApiPropertyOptional({
    description: 'Auth0 user identifier (obtained after Auth0 registration)',
  })
  @IsOptional()
  @IsString()
  auth0Id?: string;

  @ApiProperty({ description: 'Full name of the admin' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address of the admin' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
