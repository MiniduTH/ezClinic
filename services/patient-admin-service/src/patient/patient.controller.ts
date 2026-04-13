import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PatientService, ReportFilter } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UploadReportDto } from './dto/upload-report.dto';
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
  create(@Body() createPatientDto: CreatePatientDto, @Req() req: any) {
    if (req.user && req.user.sub) {
      createPatientDto.auth0Id = req.user.sub;
    }
    return this.patientService.create(createPatientDto);
  }

  @Get()
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all patients (Admin only)' })
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

  @Put('me')
  @ApiBearerAuth()
  @Roles('patient')
  @ApiOperation({ summary: 'Update current patient profile' })
  @ApiResponse({ status: 200, description: 'Profile updated.' })
  updateMe(@Req() req: any, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientService.updateMe(req.user.sub, updatePatientDto);
  }

  @Post('me/avatar')
  @ApiBearerAuth()
  @Roles('patient')
  @ApiOperation({ summary: 'Upload profile avatar (JPEG/PNG, max 2 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.patientService.uploadAvatar(req.user.sub, file);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles('patient', 'doctor', 'admin')
  @ApiOperation({ summary: 'Get a specific patient profile' })
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
  @ApiOperation({ summary: 'Update a patient profile (full replace)' })
  putUpdate(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
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

  // ─── Medical Reports ─────────────────────────────────────────────

  @Post(':id/reports')
  @ApiBearerAuth()
  @Roles('patient', 'admin')
  @ApiOperation({ summary: 'Upload a medical report for a patient (PDF/JPEG/PNG, max 10 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        reportType: { type: 'string', enum: ['lab', 'imaging', 'prescription', 'other'] },
        description: { type: 'string' },
        reportDate: { type: 'string', format: 'date' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['title', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadReport(
    @Param('id') id: string,
    @Body() dto: UploadReportDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.patientService.uploadReport(id, dto, file);
  }

  @Get(':id/reports')
  @ApiBearerAuth()
  @Roles('patient', 'doctor', 'admin')
  @ApiOperation({ summary: 'Get medical reports for a patient (paginated, filterable)' })
  @ApiQuery({ name: 'reportType', required: false, enum: ['lab', 'imaging', 'prescription', 'other'] })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'ISO date string (inclusive)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'ISO date string (inclusive)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getReports(
    @Param('id') id: string,
    @Query('reportType') reportType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filter: ReportFilter = {
      reportType: reportType as any,
      dateFrom,
      dateTo,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
    };
    return this.patientService.getReports(id, filter);
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
  @ApiOperation({ summary: 'Soft-delete a medical report' })
  deleteReport(@Param('id') id: string, @Param('reportId') reportId: string) {
    return this.patientService.deleteReport(id, reportId);
  }
}


