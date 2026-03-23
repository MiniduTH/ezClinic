import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsMilitaryTime } from 'class-validator';

export class CreateAvailabilityDto {
  @ApiProperty({
    description: 'Day of the week',
    example: 'Monday',
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  })
  @IsNotEmpty()
  @IsString()
  dayOfWeek: string;

  @ApiProperty({ description: 'Slot start time (HH:mm)', example: '09:00' })
  @IsNotEmpty()
  @IsMilitaryTime()
  startTime: string;

  @ApiProperty({ description: 'Slot end time (HH:mm)', example: '13:00' })
  @IsNotEmpty()
  @IsMilitaryTime()
  endTime: string;
}
