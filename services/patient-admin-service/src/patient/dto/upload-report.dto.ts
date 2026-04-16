import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type ReportType = 'lab' | 'imaging' | 'prescription' | 'other';

export class UploadReportDto {
  @ApiProperty({ description: 'Human-readable title of the report' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Category: lab | imaging | prescription | other', default: 'other' })
  @IsOptional()
  @IsIn(['lab', 'imaging', 'prescription', 'other'])
  reportType?: ReportType;

  @ApiPropertyOptional({ description: 'Free-text description of the report' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Date the report was issued (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  reportDate?: string;
}
