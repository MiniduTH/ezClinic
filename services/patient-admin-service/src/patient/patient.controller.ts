import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new patient' })
  @ApiResponse({ status: 201, description: 'Patient successfully registered.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientService.create(createPatientDto);
  }

  @Get()
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all patients (Admin only typically)' })
  findAll() {
    return this.patientService.findAll();
  }

  @Get('me')
  @ApiBearerAuth()
  @Roles('patient')
  @ApiOperation({ summary: 'Get current patient profile' })
  findMe(@Req() req: any) {
    return this.patientService.findByAuth0Id(req.user.sub);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles('patient', 'doctor', 'admin')
  @ApiOperation({ summary: 'Get a specific patient profile' })
  @ApiResponse({ status: 200, description: 'Profile found.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  findOne(@Param('id') id: string) {
    return this.patientService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles('patient', 'admin')
  @ApiOperation({ summary: 'Update a patient profile (partial)' })
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientService.update(id, updatePatientDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles('patient', 'admin')
  @ApiOperation({ summary: 'Update a patient profile (full)' })
  @ApiResponse({ status: 200, description: 'Profile updated.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  putUpdate(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    // Reusing the update service method since UpdatePatientDto covers fields
    return this.patientService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @Roles('patient', 'admin')
  @ApiOperation({ summary: 'Delete a patient' })
  remove(@Param('id') id: string) {
    return this.patientService.remove(id);
  }

  @Post(':id/reports')
  @ApiBearerAuth()
  @Roles('patient', 'admin')
  @ApiOperation({ summary: 'Upload a medical report for a patient' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['title', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadReport(
    @Param('id') id: string,
    @Body('title') title: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.patientService.uploadReport(id, title, file);
  }

  @Get(':id/reports')
  @ApiBearerAuth()
  @Roles('patient', 'doctor', 'admin')
  @ApiOperation({ summary: 'Get all medical reports for a patient' })
  getReports(@Param('id') id: string) {
    return this.patientService.getReports(id);
  }

  @Get(':id/reports/:reportId')
  @ApiBearerAuth()
  @Roles('patient', 'doctor', 'admin')
  @ApiOperation({ summary: 'Get a specific medical report' })
  getReport(@Param('id') id: string, @Param('reportId') reportId: string) {
    return this.patientService.getReport(id, reportId);
  }

  @Delete(':id/reports/:reportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @Roles('patient', 'admin')
  @ApiOperation({ summary: 'Delete a medical report' })
  deleteReport(@Param('id') id: string, @Param('reportId') reportId: string) {
    return this.patientService.deleteReport(id, reportId);
  }
}
