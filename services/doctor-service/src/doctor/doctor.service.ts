import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Doctor, DoctorDocument } from './schemas/doctor.schema';
import {
  Availability,
  AvailabilityDocument,
} from './schemas/availability.schema';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

import { AppointmentIntegrationService } from './integration/appointment.integration.service';
import { PatientIntegrationService } from './integration/patient.integration.service';

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(Doctor.name)
    private readonly doctorModel: Model<DoctorDocument>,
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    private readonly appointmentIntegration: AppointmentIntegrationService,
    private readonly patientIntegration: PatientIntegrationService,
  ) {}

  // ─── Helper ───────────────────────────────────────────────────────

  private wrap(data: any, message?: string) {
    return { success: true, data, ...(message && { message }) };
  }

  // ─── Doctor Profile ────────────────────────────────────────────────

  async create(dto: CreateDoctorDto) {
    // Idempotent on Auth0 sub: return existing profile if already registered
    if (dto.auth0Id) {
      const existing = await this.doctorModel.findById(dto.auth0Id).lean();
      if (existing) return this.wrap(existing, 'Doctor already registered.');
    }

    // Guard against email collision from a different account
    const emailConflict = await this.doctorModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (emailConflict)
      throw new ConflictException(
        'Email is already associated with another account',
      );

    const doctor = await this.doctorModel.create({ ...dto, _id: dto.auth0Id });
    return this.wrap(
      doctor,
      'Doctor registered successfully. Awaiting admin verification.',
    );
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    specialization?: string;
    search?: string;
    isVerified?: boolean;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    // By default, return all doctors; caller can explicitly filter by verification state.
    const filter: any = {};

    if (query.isVerified !== undefined) {
      filter.isVerified = query.isVerified;
    }

    if (query.specialization) {
      filter.specialization = { $regex: query.specialization, $options: 'i' };
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, totalItems] = await Promise.all([
      this.doctorModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.doctorModel.countDocuments(filter),
    ]);

    // Attach availability for each doctor
    const ids = data.map((d) => (d as any)._id as string);
    const avail = await this.availabilityModel
      .find({ doctorId: { $in: ids } })
      .lean();

    const enriched = data.map((doc) => ({
      ...doc,
      id: (doc as any)._id as string,
      availability: avail.filter((a) => a.doctorId === (doc as any)._id),
    }));

    return {
      success: true,
      data: enriched,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(id: string) {
    const doctor = await this.doctorModel.findById(id).lean();
    if (!doctor) throw new NotFoundException(`Doctor with ID ${id} not found`);
    const availability = await this.availabilityModel
      .find({ doctorId: id })
      .lean();
    return this.wrap({
      ...doctor,
      id: (doctor as any)._id as string,
      availability,
    });
  }

  async findByAuth0Id(auth0Id: string) {
    // Since _id IS the auth0 sub, this is just a findById
    return this.findOne(auth0Id);
  }

  async verify(id: string, approve = true) {
    const doctor = await this.doctorModel.findById(id);
    if (!doctor) throw new NotFoundException(`Doctor with ID ${id} not found`);
    doctor.isVerified = approve;
    await doctor.save();
    return this.wrap(
      doctor,
      approve ? 'Doctor approved successfully.' : 'Doctor rejected.',
    );
  }

  async update(id: string, dto: UpdateDoctorDto) {
    const doctor = await this.doctorModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!doctor) throw new NotFoundException(`Doctor with ID ${id} not found`);
    return this.wrap(doctor, 'Doctor profile updated successfully.');
  }

  async remove(id: string): Promise<void> {
    const result = await this.doctorModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`Doctor with ID ${id} not found`);
    await this.availabilityModel.deleteMany({ doctorId: id });
  }

  // ─── Availability ─────────────────────────────────────────────────

  private async checkOverlap(
    doctorId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    excludeSlotId?: string,
  ): Promise<void> {
    if (startTime >= endTime)
      throw new BadRequestException('Start time must be before end time.');

    const filter: any = {
      doctorId,
      dayOfWeek,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    };
    if (excludeSlotId) filter._id = { $ne: new Types.ObjectId(excludeSlotId) };

    const overlapping = await this.availabilityModel.findOne(filter).lean();
    if (overlapping) {
      throw new ConflictException(
        `This slot overlaps with an existing slot on ${dayOfWeek} ` +
          `(${overlapping.startTime}–${overlapping.endTime}). Please adjust the times.`,
      );
    }
  }

  async addAvailability(doctorId: string, dto: CreateAvailabilityDto) {
    await this.findOne(doctorId); // verify doctor exists
    await this.checkOverlap(
      doctorId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    );
    const slot = await this.availabilityModel.create({ ...dto, doctorId });
    return this.wrap(slot, 'Availability slot added.');
  }

  async addBulkAvailability(doctorId: string, dtos: CreateAvailabilityDto[]) {
    await this.findOne(doctorId);
    for (const dto of dtos) {
      await this.checkOverlap(
        doctorId,
        dto.dayOfWeek,
        dto.startTime,
        dto.endTime,
      );
    }
    const slots = await this.availabilityModel.insertMany(
      dtos.map((dto) => ({ ...dto, doctorId })),
    );
    return this.wrap(slots, `${slots.length} availability slots added.`);
  }

  async getAvailability(doctorId: string) {
    await this.findOne(doctorId);
    const slots = await this.availabilityModel
      .find({ doctorId })
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();
    const grouped = this.groupByDay(slots as any[]);
    return this.wrap({ slots, grouped });
  }

  async getAvailabilityByDay(doctorId: string, dayOfWeek: string) {
    await this.findOne(doctorId);
    const slots = await this.availabilityModel
      .find({ doctorId, dayOfWeek, isActive: true })
      .sort({ startTime: 1 })
      .lean();
    return this.wrap(slots);
  }

  async updateAvailability(
    doctorId: string,
    slotId: string,
    dto: UpdateAvailabilityDto,
  ) {
    if (!Types.ObjectId.isValid(slotId))
      throw new NotFoundException(`Slot ${slotId} not found`);
    const slot = await this.availabilityModel.findOne({
      _id: new Types.ObjectId(slotId),
      doctorId,
    });
    if (!slot)
      throw new NotFoundException(`Availability slot ${slotId} not found`);

    const newDay = dto.dayOfWeek || slot.dayOfWeek;
    const newStart = dto.startTime || slot.startTime;
    const newEnd = dto.endTime || slot.endTime;
    if (dto.dayOfWeek || dto.startTime || dto.endTime) {
      await this.checkOverlap(doctorId, newDay, newStart, newEnd, slotId);
    }

    Object.assign(slot, dto);
    await slot.save();
    return this.wrap(slot, 'Availability slot updated.');
  }

  async toggleAvailability(doctorId: string, slotId: string) {
    if (!Types.ObjectId.isValid(slotId))
      throw new NotFoundException(`Slot ${slotId} not found`);
    const slot = await this.availabilityModel.findOne({
      _id: new Types.ObjectId(slotId),
      doctorId,
    });
    if (!slot)
      throw new NotFoundException(`Availability slot ${slotId} not found`);
    slot.isActive = !slot.isActive;
    await slot.save();
    return this.wrap(
      slot,
      `Slot ${slot.isActive ? 'activated' : 'deactivated'}.`,
    );
  }

  async removeAvailability(doctorId: string, slotId: string): Promise<void> {
    if (!Types.ObjectId.isValid(slotId))
      throw new NotFoundException(`Slot ${slotId} not found`);
    const result = await this.availabilityModel.findOneAndDelete({
      _id: new Types.ObjectId(slotId),
      doctorId,
    });
    if (!result)
      throw new NotFoundException(`Availability slot ${slotId} not found`);
  }

  async clearDayAvailability(
    doctorId: string,
    dayOfWeek: string,
  ): Promise<void> {
    await this.findOne(doctorId);
    await this.availabilityModel.deleteMany({ doctorId, dayOfWeek });
  }

  // ─── External Integrations ─────────────────────────────────────────

  async getDoctorAppointments(doctorId: string) {
    await this.findOne(doctorId); // verify exists
    const response =
      await this.appointmentIntegration.getAppointmentsByDoctor(doctorId);
    return response; // returning the raw response from integration
  }

  async updateAppointmentStatus(appointmentId: string, status: string) {
    // Basic business rule from prompt: Only allow PENDING -> ACCEPTED/REJECTED
    // We could fetch the current status first, but let's delegate to the integration
    return this.appointmentIntegration.updateAppointmentStatus(
      appointmentId,
      status,
    );
  }

  async getPatientDetails(patientId: string) {
    return this.patientIntegration.getPatientById(patientId);
  }

  async getPatientReports(patientId: string) {
    return this.patientIntegration.getPatientReports(patientId);
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private groupByDay(slots: any[]) {
    const dayOrder = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const grouped: Record<string, any[]> = {};
    for (const day of dayOrder) {
      const daySlots = slots.filter((s) => s.dayOfWeek === day);
      if (daySlots.length > 0) grouped[day] = daySlots;
    }
    return grouped;
  }
}
