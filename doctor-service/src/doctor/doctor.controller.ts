import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  // ─── Doctor Profile ────────────────────────────────────────────────

  @Post('register')
  @ApiOperation({ summary: 'Register a new doctor' })
  @ApiResponse({
    status: 201,
    description: 'Doctor registered successfully. Awaiting admin verification.',
  })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  register(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorService.create(createDoctorDto);
  }

  @Get()
  @ApiOperation({ summary: 'List / search all verified doctors' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'specialization', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('specialization') specialization?: string,
    @Query('search') search?: string,
  ) {
    return this.doctorService.findAll({ page, limit, specialization, search });
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '(Admin) Verify a doctor registration' })
  @ApiResponse({ status: 200, description: 'Doctor verified successfully.' })
  @ApiResponse({ status: 400, description: 'Doctor is already verified.' })
  @ApiResponse({ status: 404, description: 'Doctor not found.' })
  verifyDoctor(@Param('id') id: string) {
    return this.doctorService.verify(id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated doctor profile' })
  @ApiResponse({ status: 200, description: 'Profile found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getMe(@CurrentUser() user: Record<string, unknown>) {
    // Auth0 sub is the unique identifier for the user (e.g. "auth0|abc123")
    const auth0Sub = user['sub'] as string;
    return this.doctorService.findByAuth0Id(auth0Sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific doctor profile' })
  @ApiResponse({ status: 200, description: 'Profile found.' })
  @ApiResponse({ status: 404, description: 'Doctor not found.' })
  findOne(@Param('id') id: string) {
    return this.doctorService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a doctor profile' })
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorService.update(id, updateDoctorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a doctor' })
  remove(@Param('id') id: string) {
    return this.doctorService.remove(id);
  }

  // ─── Availability ─────────────────────────────────────────────────

  @Post(':doctorId/availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a single availability slot' })
  @ApiResponse({ status: 201, description: 'Slot added.' })
  @ApiResponse({
    status: 409,
    description: 'Slot overlaps with an existing slot.',
  })
  addAvailability(
    @Param('doctorId') doctorId: string,
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.doctorService.addAvailability(doctorId, dto);
  }

  @Post(':doctorId/availability/bulk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add multiple availability slots at once' })
  @ApiResponse({
    status: 201,
    description: 'All slots added successfully.',
  })
  @ApiResponse({
    status: 409,
    description: 'One or more slots overlap — no slots saved.',
  })
  addBulkAvailability(
    @Param('doctorId') doctorId: string,
    @Body() dtos: CreateAvailabilityDto[],
  ) {
    return this.doctorService.addBulkAvailability(doctorId, dtos);
  }

  @Get(':doctorId/availability')
  @ApiOperation({ summary: "Get all of a doctor's availability slots" })
  getAvailability(@Param('doctorId') doctorId: string) {
    return this.doctorService.getAvailability(doctorId);
  }

  @Get(':doctorId/availability/:day')
  @ApiOperation({ summary: 'Get availability for a specific day' })
  @ApiParam({
    name: 'day',
    enum: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
  })
  getAvailabilityByDay(
    @Param('doctorId') doctorId: string,
    @Param('day') day: string,
  ) {
    return this.doctorService.getAvailabilityByDay(doctorId, day);
  }

  @Put(':doctorId/availability/:slotId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an availability slot' })
  @ApiResponse({
    status: 409,
    description: 'Updated slot overlaps with an existing slot.',
  })
  updateAvailability(
    @Param('doctorId') doctorId: string,
    @Param('slotId') slotId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.doctorService.updateAvailability(doctorId, slotId, dto);
  }

  @Patch(':doctorId/availability/:slotId/toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle a slot active/inactive' })
  toggleAvailability(
    @Param('doctorId') doctorId: string,
    @Param('slotId') slotId: string,
  ) {
    return this.doctorService.toggleAvailability(doctorId, slotId);
  }

  @Delete(':doctorId/availability/:slotId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an availability slot' })
  removeAvailability(
    @Param('doctorId') doctorId: string,
    @Param('slotId') slotId: string,
  ) {
    return this.doctorService.removeAvailability(doctorId, slotId);
  }

  @Delete(':doctorId/availability/day/:day')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear all availability for a specific day' })
  @ApiParam({
    name: 'day',
    enum: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
  })
  clearDayAvailability(
    @Param('doctorId') doctorId: string,
    @Param('day') day: string,
  ) {
    return this.doctorService.clearDayAvailability(doctorId, day);
  }

  // ─── External Integrations ─────────────────────────────────────────

  @Get(':id/appointments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch appointments for a doctor from Appointment Service' })
  getAppointments(@Param('id') id: string) {
    return this.doctorService.getDoctorAppointments(id);
  }

  @Patch('/appointments/:appointmentId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update appointment status via Appointment Service' })
  updateStatus(
    @Param('appointmentId') appointmentId: string,
    @Body('status') status: string,
  ) {
    return this.doctorService.updateAppointmentStatus(appointmentId, status);
  }

  @Get('/patients/:patientId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch patient details from Patient Service' })
  getPatient(@Param('patientId') patientId: string) {
    return this.doctorService.getPatientDetails(patientId);
  }

  @Get('/patients/:patientId/reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch patient reports from Patient Service' })
  getReports(@Param('patientId') patientId: string) {
    return this.doctorService.getPatientReports(patientId);
  }
}
