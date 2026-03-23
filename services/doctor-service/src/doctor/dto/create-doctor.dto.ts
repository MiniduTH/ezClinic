import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateDoctorDto {
  @ApiPropertyOptional({
    description: 'Auth0 user identifier (obtained after Auth0 registration)',
  })
  @IsOptional()
  @IsString()
  auth0Id?: string;

  @ApiProperty({ description: 'Full name of the doctor', example: 'Dr. Kamal Silva' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address', example: 'kamal@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Medical specialization', example: 'Cardiologist' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({
    description: 'Medical qualifications',
    example: 'MBBS, MD (Cardiology) — University of Colombo',
  })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ description: 'Short biography' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Consultation fee in LKR',
    example: 3500.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;
}
