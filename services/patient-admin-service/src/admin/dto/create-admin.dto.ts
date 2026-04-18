import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ description: 'Full name of the admin' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address of the admin' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
