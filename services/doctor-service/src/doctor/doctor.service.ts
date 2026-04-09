import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Doctor, DoctorDocument } from './schemas/doctor.schema';
import { Availability, AvailabilityDocument } from './schemas/availability.schema';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(Doctor.name) private readonly doctorModel: Model<DoctorDocument>,
    @InjectModel(Availability.name) private readonly availabilityModel: Model<AvailabilityDocument>,
  ) {}

  // ─── Helper ───────────────────────────────────────────────────────

  private wrap(data: any, message?: string) {
    return { success: true, data, ...(message && { message }) };
  }

  // ─── Doctor Profile ────────────────────────────────────────────────

  async create(dto: CreateDoctorDto) {
    const existing = await this.doctorModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Doctor with this email already exists');

    const doctor = await this.doctorModel.create(dto);
    return this.wrap(doctor, 'Doctor registered successfully. Awaiting admin verification.');
  }

  async findAll(query: { page?: number; limit?: number; specialization?: string; search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: any = { isVerified: true };

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
      this.doctorModel.find(filter).skip((page - 1) * limit).limit(limit).lean(),
      this.doctorModel.countDocuments(filter),
    ]);

    // Attach availability counts
    const ids = data.map((d) => (d as any)._id);
    const avail = await this.availabilityModel.find({ doctorId: { $in: ids } }).lean();

    const enriched = data.map((doc) => ({
      ...doc,
      id: (doc as any)._id.toString(),
      availability: avail.filter((a) => a.doctorId.toString() === (doc as any)._id.toString()),
    }));

    return {
      success: true,
      data: enriched,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException(`Doctor ${id} not found`);
    const doctor = await this.doctorModel.findById(id).lean();
    if (!doctor) throw new NotFoundException(`Doctor with ID ${id} not found`);
    const availability = await this.availabilityModel.find({ doctorId: new Types.ObjectId(id) }).lean();
    return this.wrap({ ...doctor, id: (doctor as any)._id.toString(), availability });
  }

  async findByAuth0Id(auth0Id: string) {
    const doctor = await this.doctorModel.findOne({ auth0Id }).lean();
    if (!doctor) throw new NotFoundException('Doctor not found');
    const availability = await this.availabilityModel.find({ doctorId: (doctor as any)._id }).lean();
    return this.wrap({ ...doctor, id: (doctor as any)._id.toString(), availability });
  }

  async verify(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException(`Doctor ${id} not found`);
    const doctor = await this.doctorModel.findById(id);
    if (!doctor) throw new NotFoundException(`Doctor with ID ${id} not found`);
    if (doctor.isVerified) throw new BadRequestException('Doctor is already verified');
    doctor.isVerified = true;
    await doctor.save();
    return this.wrap(doctor, 'Doctor verified successfully.');
  }

  async update(id: string, dto: UpdateDoctorDto) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException(`Doctor ${id} not found`);
    const doctor = await this.doctorModel.findByIdAndUpdate(id, dto, { new: true });
    if (!doctor) throw new NotFoundException(`Doctor with ID ${id} not found`);
    return this.wrap(doctor, 'Doctor profile updated successfully.');
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException(`Doctor ${id} not found`);
    const result = await this.doctorModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`Doctor with ID ${id} not found`);
    await this.availabilityModel.deleteMany({ doctorId: new Types.ObjectId(id) });
  }

  // ─── Availability ─────────────────────────────────────────────────

  private async checkOverlap(
    doctorId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    excludeSlotId?: string,
  ): Promise<void> {
    if (startTime >= endTime) throw new BadRequestException('Start time must be before end time.');

    const filter: any = {
      doctorId: new Types.ObjectId(doctorId),
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
    await this.checkOverlap(doctorId, dto.dayOfWeek, dto.startTime, dto.endTime);
    const slot = await this.availabilityModel.create({ ...dto, doctorId: new Types.ObjectId(doctorId) });
    return this.wrap(slot, 'Availability slot added.');
  }

  async addBulkAvailability(doctorId: string, dtos: CreateAvailabilityDto[]) {
    await this.findOne(doctorId);
    for (const dto of dtos) {
      await this.checkOverlap(doctorId, dto.dayOfWeek, dto.startTime, dto.endTime);
    }
    const slots = await this.availabilityModel.insertMany(
      dtos.map((dto) => ({ ...dto, doctorId: new Types.ObjectId(doctorId) })),
    );
    return this.wrap(slots, `${slots.length} availability slots added.`);
  }

  async getAvailability(doctorId: string) {
    await this.findOne(doctorId);
    const slots = await this.availabilityModel
      .find({ doctorId: new Types.ObjectId(doctorId) })
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();
    const grouped = this.groupByDay(slots as any[]);
    return this.wrap({ slots, grouped });
  }

  async getAvailabilityByDay(doctorId: string, dayOfWeek: string) {
    await this.findOne(doctorId);
    const slots = await this.availabilityModel
      .find({ doctorId: new Types.ObjectId(doctorId), dayOfWeek, isActive: true })
      .sort({ startTime: 1 })
      .lean();
    return this.wrap(slots);
  }

  async updateAvailability(doctorId: string, slotId: string, dto: UpdateAvailabilityDto) {
    if (!Types.ObjectId.isValid(slotId)) throw new NotFoundException(`Slot ${slotId} not found`);
    const slot = await this.availabilityModel.findOne({
      _id: new Types.ObjectId(slotId),
      doctorId: new Types.ObjectId(doctorId),
    });
    if (!slot) throw new NotFoundException(`Availability slot ${slotId} not found`);

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
    if (!Types.ObjectId.isValid(slotId)) throw new NotFoundException(`Slot ${slotId} not found`);
    const slot = await this.availabilityModel.findOne({
      _id: new Types.ObjectId(slotId),
      doctorId: new Types.ObjectId(doctorId),
    });
    if (!slot) throw new NotFoundException(`Availability slot ${slotId} not found`);
    slot.isActive = !slot.isActive;
    await slot.save();
    return this.wrap(slot, `Slot ${slot.isActive ? 'activated' : 'deactivated'}.`);
  }

  async removeAvailability(doctorId: string, slotId: string): Promise<void> {
    if (!Types.ObjectId.isValid(slotId)) throw new NotFoundException(`Slot ${slotId} not found`);
    const result = await this.availabilityModel.findOneAndDelete({
      _id: new Types.ObjectId(slotId),
      doctorId: new Types.ObjectId(doctorId),
    });
    if (!result) throw new NotFoundException(`Availability slot ${slotId} not found`);
  }

  async clearDayAvailability(doctorId: string, dayOfWeek: string): Promise<void> {
    await this.findOne(doctorId);
    await this.availabilityModel.deleteMany({ doctorId: new Types.ObjectId(doctorId), dayOfWeek });
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private groupByDay(slots: any[]) {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const grouped: Record<string, any[]> = {};
    for (const day of dayOrder) {
      const daySlots = slots.filter((s) => s.dayOfWeek === day);
      if (daySlots.length > 0) grouped[day] = daySlots;
    }
    return grouped;
  }
}
