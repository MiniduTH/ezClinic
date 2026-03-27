import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { Availability } from './entities/availability.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
  ) {}

  // ─── Helper: standard response wrapper ────────────────────────────

  private wrap(data: any, message?: string) {
    return {
      success: true,
      data,
      ...(message && { message }),
    };
  }

  // ─── Doctor Profile ────────────────────────────────────────────────

  async create(createDoctorDto: CreateDoctorDto) {
    const existing = await this.doctorRepository.findOne({
      where: { email: createDoctorDto.email },
    });

    if (existing) {
      throw new ConflictException('Doctor with this email already exists');
    }

    const doctor = this.doctorRepository.create(createDoctorDto);
    const saved = await this.doctorRepository.save(doctor);
    return this.wrap(saved, 'Doctor registered successfully. Awaiting admin verification.');
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    specialization?: string;
    search?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const qb = this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.availability', 'availability')
      .where('doctor.isVerified = :verified', { verified: true });

    if (query.specialization) {
      qb.andWhere('doctor.specialization ILIKE :spec', {
        spec: `%${query.specialization}%`,
      });
    }

    if (query.search) {
      qb.andWhere('(doctor.name ILIKE :search OR doctor.email ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [data, totalItems] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(id: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['availability'],
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return this.wrap(doctor);
  }

  async findByAuth0Id(auth0Id: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { auth0Id },
      relations: ['availability'],
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor not found`);
    }
    return this.wrap(doctor);
  }

  async verify(id: string) {
    const { data: doctor } = await this.findOne(id);
    if (doctor.isVerified) {
      throw new BadRequestException('Doctor is already verified');
    }
    doctor.isVerified = true;
    const saved = await this.doctorRepository.save(doctor);
    return this.wrap(saved, 'Doctor verified successfully.');
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto) {
    const { data: doctor } = await this.findOne(id);
    Object.assign(doctor, updateDoctorDto);
    const saved = await this.doctorRepository.save(doctor);
    return this.wrap(saved, 'Doctor profile updated successfully.');
  }

  async remove(id: string): Promise<void> {
    const { data: doctor } = await this.findOne(id);
    await this.doctorRepository.remove(doctor);
  }

  // ─── Availability ─────────────────────────────────────────────────

  /**
   * Checks whether a new slot overlaps with existing slots for the same
   * doctor on the same day.
   */
  private async checkOverlap(
    doctorId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    excludeSlotId?: string,
  ): Promise<void> {
    // Validate start < end
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time.');
    }

    const qb = this.availabilityRepository
      .createQueryBuilder('slot')
      .where('slot.doctor_id = :doctorId', { doctorId })
      .andWhere('slot.day_of_week = :dayOfWeek', { dayOfWeek })
      .andWhere(
        '(slot.start_time < :endTime AND slot.end_time > :startTime)',
        { startTime, endTime },
      );

    if (excludeSlotId) {
      qb.andWhere('slot.id != :excludeSlotId', { excludeSlotId });
    }

    const overlapping = await qb.getOne();

    if (overlapping) {
      throw new ConflictException(
        `This slot overlaps with an existing slot on ${dayOfWeek} ` +
        `(${overlapping.startTime}–${overlapping.endTime}). ` +
        `Please adjust the times.`,
      );
    }
  }

  async addAvailability(doctorId: string, dto: CreateAvailabilityDto) {
    const { data: doctor } = await this.findOne(doctorId);

    // Check for overlapping slots on the same day
    await this.checkOverlap(doctorId, dto.dayOfWeek, dto.startTime, dto.endTime);

    const slot = this.availabilityRepository.create({
      ...dto,
      doctor,
    });
    const saved = await this.availabilityRepository.save(slot);
    return this.wrap(saved, 'Availability slot added.');
  }

  async addBulkAvailability(doctorId: string, dtos: CreateAvailabilityDto[]) {
    const { data: doctor } = await this.findOne(doctorId);

    // Validate all slots first, don't save any if one fails
    for (const dto of dtos) {
      await this.checkOverlap(doctorId, dto.dayOfWeek, dto.startTime, dto.endTime);
    }

    const slots = dtos.map((dto) =>
      this.availabilityRepository.create({ ...dto, doctor }),
    );
    const saved = await this.availabilityRepository.save(slots);
    return this.wrap(saved, `${saved.length} availability slots added.`);
  }

  async getAvailability(doctorId: string) {
    // Verify doctor exists
    await this.findOne(doctorId);

    const slots = await this.availabilityRepository.find({
      where: { doctor: { id: doctorId } },
      order: {
        dayOfWeek: 'ASC',
        startTime: 'ASC',
      },
    });

    // Group by day for a cleaner response
    const grouped = this.groupByDay(slots);

    return this.wrap({
      slots,
      grouped,
    });
  }

  async getAvailabilityByDay(doctorId: string, dayOfWeek: string) {
    await this.findOne(doctorId);

    const slots = await this.availabilityRepository.find({
      where: { doctor: { id: doctorId }, dayOfWeek, isActive: true },
      order: { startTime: 'ASC' },
    });

    return this.wrap(slots);
  }

  async updateAvailability(
    doctorId: string,
    slotId: string,
    dto: UpdateAvailabilityDto,
  ) {
    const slot = await this.availabilityRepository.findOne({
      where: { id: slotId, doctor: { id: doctorId } },
    });
    if (!slot) {
      throw new NotFoundException(`Availability slot ${slotId} not found`);
    }

    // If times or day changed, check for overlaps
    const newDay = dto.dayOfWeek || slot.dayOfWeek;
    const newStart = dto.startTime || slot.startTime;
    const newEnd = dto.endTime || slot.endTime;

    if (dto.dayOfWeek || dto.startTime || dto.endTime) {
      await this.checkOverlap(doctorId, newDay, newStart, newEnd, slotId);
    }

    Object.assign(slot, dto);
    const saved = await this.availabilityRepository.save(slot);
    return this.wrap(saved, 'Availability slot updated.');
  }

  async toggleAvailability(doctorId: string, slotId: string) {
    const slot = await this.availabilityRepository.findOne({
      where: { id: slotId, doctor: { id: doctorId } },
    });
    if (!slot) {
      throw new NotFoundException(`Availability slot ${slotId} not found`);
    }

    slot.isActive = !slot.isActive;
    const saved = await this.availabilityRepository.save(slot);
    return this.wrap(
      saved,
      `Slot ${saved.isActive ? 'activated' : 'deactivated'}.`,
    );
  }

  async removeAvailability(doctorId: string, slotId: string): Promise<void> {
    const slot = await this.availabilityRepository.findOne({
      where: { id: slotId, doctor: { id: doctorId } },
    });
    if (!slot) {
      throw new NotFoundException(`Availability slot ${slotId} not found`);
    }
    await this.availabilityRepository.remove(slot);
  }

  async clearDayAvailability(
    doctorId: string,
    dayOfWeek: string,
  ): Promise<void> {
    await this.findOne(doctorId);
    await this.availabilityRepository.delete({
      doctor: { id: doctorId },
      dayOfWeek,
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private groupByDay(slots: Availability[]) {
    const dayOrder = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    const grouped: Record<string, Availability[]> = {};

    for (const day of dayOrder) {
      const daySlots = slots.filter((s) => s.dayOfWeek === day);
      if (daySlots.length > 0) {
        grouped[day] = daySlots;
      }
    }

    return grouped;
  }
}
