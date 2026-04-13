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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('admins')
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

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all admins' })
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a specific admin profile' })
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update an admin profile' })
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an admin' })
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }

  // ─── Platform Operations ────────────────────────────────────────

  @Get('platform/stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Get extended platform statistics for admin dashboard' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('platform/patients')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all patients with optional search and status filter' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'suspended'] })
  getAllPatients(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllPatients(search, status);
  }

  @Get('platform/patients/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a single patient with full details' })
  getPatientById(@Param('id') id: string) {
    return this.adminService.getPatientById(id);
  }

  @Put('platform/patients/:id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Activate, deactivate, or suspend a patient account' })
  @ApiResponse({ status: 200, description: 'Status updated.' })
  updatePatientStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updatePatientStatus(id, dto);
  }

  @Delete('platform/patients/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a patient account (Admin operation)' })
  deletePatient(@Param('id') id: string) {
    return this.adminService.deletePatient(id);
  }
}

