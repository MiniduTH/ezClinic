import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@ApiTags('prescriptions')
@ApiBearerAuth()
@Controller()
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post('doctors/:doctorId/prescriptions')
  @ApiOperation({ summary: 'Issue a digital prescription' })
  @ApiResponse({ status: 201, description: 'Prescription issued successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  create(
    @Param('doctorId') doctorId: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.prescriptionService.create(doctorId, dto);
  }

  @Get('doctors/:doctorId/prescriptions')
  @ApiOperation({ summary: 'List prescriptions issued by a doctor' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.prescriptionService.findByDoctor(doctorId, page, limit);
  }

  @Get('patients/:patientId/prescriptions')
  @ApiOperation({ summary: "View a patient's prescriptions" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByPatient(
    @Param('patientId') patientId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.prescriptionService.findByPatient(patientId, page, limit);
  }

  @Get('appointments/:appointmentId/prescription')
  @ApiOperation({ summary: 'Get prescription for a specific appointment' })
  @ApiResponse({ status: 200, description: 'Prescription found.' })
  @ApiResponse({ status: 404, description: 'No prescription for this appointment.' })
  findByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.prescriptionService.findByAppointment(appointmentId);
  }

  @Get('prescriptions/:id')
  @ApiOperation({ summary: 'Get a specific prescription with summary' })
  @ApiResponse({ status: 200, description: 'Prescription found.' })
  @ApiResponse({ status: 404, description: 'Prescription not found.' })
  findOne(@Param('id') id: string) {
    return this.prescriptionService.findOne(id);
  }
}
