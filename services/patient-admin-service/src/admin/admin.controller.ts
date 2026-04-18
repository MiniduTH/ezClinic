import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Admin Profile Management ──────────────────────────────────

  @Post('register')
  @ApiOperation({ summary: 'Register a new admin' })
  @ApiResponse({ status: 201, description: 'Admin successfully registered.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  // ─── Platform Stats ─────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics for admin dashboard' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ─── Patient Management ─────────────────────────────────────────

  @Get('patients')
  @ApiOperation({ summary: 'Get all patients (paginated, searchable)' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or email',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'suspended'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllPatients(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAllPatients(
      search,
      status,
      page ? +page : 1,
      limit ? +limit : 20,
    );
  }

  @Get('patients/:id')
  @ApiOperation({ summary: 'Get a single patient with full details' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  getPatientById(@Param('id') id: string) {
    return this.adminService.getPatientById(id);
  }

  @Patch('patients/:id/suspend')
  @ApiOperation({ summary: 'Suspend or reactivate a patient account' })
  @ApiResponse({ status: 200, description: 'Status updated.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { status: { type: 'string', enum: ['active', 'suspended'] } },
      required: ['status'],
    },
  })
  updatePatientStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updatePatientStatus(id, dto);
  }

  @Delete('patients/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a patient account' })
  deletePatient(@Param('id') id: string) {
    return this.adminService.deletePatient(id);
  }

  // ─── Doctor Verification ────────────────────────────────────────

  @Get('doctors/pending')
  @ApiOperation({ summary: 'List doctors awaiting verification' })
  @ApiResponse({ status: 200, description: 'List of unverified doctors.' })
  getPendingDoctors(@Req() req: any) {
    const token = req.headers.authorization;
    return this.adminService.getPendingDoctors(token);
  }

  @Patch('doctors/:id/verify')
  @ApiOperation({ summary: 'Approve or reject a doctor registration' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['approve', 'reject'] },
        reason: { type: 'string' },
      },
      required: ['action'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Doctor verification status updated.',
  })
  verifyDoctor(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject'; reason?: string },
    @Req() req: any,
  ) {
    const token = req.headers.authorization;
    return this.adminService.verifyDoctor(id, body.action, token, body.reason);
  }

  // ─── Admin Management ───────────────────────────────────────────

  @Get('admins')
  @ApiOperation({ summary: 'Get all admins' })
  findAll() {
    return this.adminService.findAll();
  }

  @Get('admins/:id')
  @ApiOperation({ summary: 'Get a specific admin profile' })
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(id);
  }

  @Patch('admins/:id')
  @ApiOperation({ summary: 'Update an admin profile' })
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete('admins/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an admin' })
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }
}
