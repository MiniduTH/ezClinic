import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
  IsDateString,
} from 'class-validator';

export class RegisterPatientDto {
  @ApiProperty({ description: 'Full name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (min 8 chars)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  gender?: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
