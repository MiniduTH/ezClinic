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
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PatientService, ReportFilter } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UploadReportDto } from './dto/upload-report.dto';

@ApiTags('patients')
@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new patient' })
  @ApiResponse({ status: 201, description: 'Patient successfully registered.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  create(@Body() createPatientDto: CreatePatientDto, @Req() req: any) {
    const sub: string = req.user?.sub;
    return this.patientService.create(sub, createPatientDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all patients' })
  findAll() {
    return this.patientService.findAll();
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current patient profile' })
  findMe(@Req() req: any) {
    return this.patientService.findByAuth0Id(req.user.sub);
  }

  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current patient profile (full replace)' })
  @ApiResponse({ status: 200, description: 'Profile updated.' })
  updateMe(@Req() req: any, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientService.updateMe(req.user.sub, updatePatientDto);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Partially update current patient profile' })
  @ApiResponse({ status: 200, description: 'Profile updated.' })
  patchMe(@Req() req: any, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientService.updateMe(req.user.sub, updatePatientDto);
  }

  @Post('me/avatar')
  @ApiBearerAuth()
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
  @ApiOperation({ summary: 'Get a specific patient profile' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  findOne(@Param('id') id: string) {
    return this.patientService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a patient profile (partial)' })
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientService.update(id, updatePatientDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a patient profile (full replace)' })
  putUpdate(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a patient' })
  remove(@Param('id') id: string) {
    return this.patientService.remove(id);
  }

  // ─── Medical Reports ─────────────────────────────────────────────

  @Post('me/reports')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Upload a medical report for the authenticated patient (PDF/JPEG/PNG, max 10 MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        reportType: {
          type: 'string',
          enum: ['lab', 'imaging', 'prescription', 'other'],
        },
        description: { type: 'string' },
        reportDate: { type: 'string', format: 'date' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['title', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadMyReport(
    @Req() req: any,
    @Body() dto: UploadReportDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.patientService.uploadReportByAuth0Id(req.user.sub, dto, file);
  }

  @Get('me/reports')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get medical reports for the authenticated patient',
  })
  @ApiQuery({
    name: 'reportType',
    required: false,
    enum: ['lab', 'imaging', 'prescription', 'other'],
  })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyReports(
    @Req() req: any,
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
    return this.patientService.getReportsByAuth0Id(req.user.sub, filter);
  }

  @Post(':id/reports')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload a medical report for a patient (PDF/JPEG/PNG, max 10 MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        reportType: {
          type: 'string',
          enum: ['lab', 'imaging', 'prescription', 'other'],
        },
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
  @ApiOperation({
    summary: 'Get medical reports for a patient (paginated, filterable)',
  })
  @ApiQuery({
    name: 'reportType',
    required: false,
    enum: ['lab', 'imaging', 'prescription', 'other'],
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'ISO date string (inclusive)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'ISO date string (inclusive)',
  })
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
  @ApiOperation({ summary: 'Get a specific medical report' })
  getReport(@Param('id') id: string, @Param('reportId') reportId: string) {
    return this.patientService.getReport(id, reportId);
  }

  @Delete(':id/reports/:reportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a medical report' })
  deleteReport(@Param('id') id: string, @Param('reportId') reportId: string) {
    return this.patientService.deleteReport(id, reportId);
  }
}
