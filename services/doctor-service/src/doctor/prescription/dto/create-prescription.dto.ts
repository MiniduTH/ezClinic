import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

class MedicationDto {
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

  @ApiProperty({ description: 'List of medications', type: [MedicationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medications: MedicationDto[];

  @ApiPropertyOptional({ description: 'Additional notes for the patient' })
  @IsOptional()
  @IsString()
  notes?: string;
}
