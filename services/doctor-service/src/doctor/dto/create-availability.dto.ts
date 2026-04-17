import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsMilitaryTime,
  IsIn,
} from 'class-validator';

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export class CreateAvailabilityDto {
  @ApiProperty({
    description: 'Day of the week',
    example: 'Monday',
    enum: DAYS_OF_WEEK,
  })
  @IsNotEmpty()
  @IsIn([...DAYS_OF_WEEK])
  dayOfWeek: string;

  @ApiProperty({ description: 'Slot start time (HH:mm)', example: '09:00' })
  @IsNotEmpty()
  @IsMilitaryTime()
  startTime: string;

  @ApiProperty({ description: 'Slot end time (HH:mm)', example: '13:00' })
  @IsNotEmpty()
  @IsMilitaryTime()
  endTime: string;

  @ApiPropertyOptional({
    description: 'Whether this slot is active for booking',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Max number of patients per slot (for walk-in clinics)',
    example: 20,
  })
  @IsOptional()
  maxPatients?: number;

  @ApiPropertyOptional({
    description: 'Consultation type for this slot',
    example: 'telemedicine',
    enum: ['in-person', 'telemedicine', 'both'],
  })
  @IsOptional()
  @IsIn(['in-person', 'telemedicine', 'both'])
  consultationType?: string;
}
