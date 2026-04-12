import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('admins')
@UseGuards(JwtAuthGuard)
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
  @ApiOperation({ summary: 'Get all admins' })
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific admin profile' })
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an admin profile' })
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an admin' })
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }

  // ─── Platform Operations ────────────────────────────────────────

  @Get('platform/stats')
  @ApiOperation({ summary: 'Get platform statistics for admin dashboard' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('platform/patients')
  @ApiOperation({ summary: 'Get all patients with their details (User Management)' })
  getAllPatients() {
    return this.adminService.getAllPatients();
  }

  @Get('platform/patients/:id')
  @ApiOperation({ summary: 'Get a single patient with full details' })
  getPatientById(@Param('id') id: string) {
    return this.adminService.getPatientById(id);
  }

  @Delete('platform/patients/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a patient account (Admin operation)' })
  deletePatient(@Param('id') id: string) {
    return this.adminService.deletePatient(id);
  }
}
