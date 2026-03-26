import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MedicationDto {
  @ApiProperty({ example: 'Aspirin 75mg' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '1 tablet' })
  @IsNotEmpty()
  @IsString()
  dosage: string;

  @ApiProperty({ example: 'Once daily' })
  @IsNotEmpty()
  @IsString()
  frequency: string;

  @ApiProperty({ example: '30 days' })
  @IsNotEmpty()
  @IsString()
  duration: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({ description: 'Appointment this prescription belongs to' })
  @IsNotEmpty()
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ description: 'Patient receiving the prescription' })
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({
    description: 'Patient name (for display on the prescription)',
    example: 'Nethmi Perera',
  })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiPropertyOptional({
    description: 'Diagnosis summary',
    example: 'Mild Hypertension (Stage 1)',
  })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiProperty({ description: 'List of medications', type: [MedicationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medications: MedicationDto[];

  @ApiPropertyOptional({ description: 'Additional notes for the patient' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Suggested follow-up date (YYYY-MM-DD)',
    example: '2026-04-20',
  })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
