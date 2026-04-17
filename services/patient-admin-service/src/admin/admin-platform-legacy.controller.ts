import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('admin')
@Controller('admins/platform')
export class AdminPlatformLegacyController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get platform statistics for admin dashboard (legacy route)',
  })
  getDashboardStatsLegacy() {
    return this.adminService.getDashboardStats();
  }

  @Get('patients')
  @ApiOperation({
    summary: 'Get all patients for admin management (legacy route)',
  })
  async getAllPatientsLegacy(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.adminService.getAllPatients(
      search,
      status,
      page ? +page : 1,
      limit ? +limit : 20,
    );
    return result.data;
  }

  @Put('patients/:id/status')
  @ApiOperation({ summary: 'Update patient status (legacy route)' })
  updatePatientStatusLegacy(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updatePatientStatus(id, dto);
  }
}
