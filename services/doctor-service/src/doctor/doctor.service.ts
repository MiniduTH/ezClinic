import {
  Injectable,
  ConflictException,
  NotFoundException,
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

  // ─── Doctor Profile ────────────────────────────────────────────────

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const existing = await this.doctorRepository.findOne({
      where: { email: createDoctorDto.email },
    });

    if (existing) {
      throw new ConflictException('Doctor with this email already exists');
    }

    const doctor = this.doctorRepository.create(createDoctorDto);
    return await this.doctorRepository.save(doctor);
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
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['availability'],
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }

  async findByAuth0Id(auth0Id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { auth0Id },
      relations: ['availability'],
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor not found`);
    }
    return doctor;
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);
    Object.assign(doctor, updateDoctorDto);
    return await this.doctorRepository.save(doctor);
  }

  async remove(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.doctorRepository.remove(doctor);
  }

  // ─── Availability ─────────────────────────────────────────────────

  async addAvailability(
    doctorId: string,
    dto: CreateAvailabilityDto,
  ): Promise<Availability> {
    const doctor = await this.findOne(doctorId);
    const slot = this.availabilityRepository.create({
      ...dto,
      doctor,
    });
    return await this.availabilityRepository.save(slot);
  }

  async getAvailability(doctorId: string): Promise<Availability[]> {
    // Verify doctor exists
    await this.findOne(doctorId);
    return await this.availabilityRepository.find({
      where: { doctor: { id: doctorId } },
    });
  }

  async updateAvailability(
    doctorId: string,
    slotId: string,
    dto: UpdateAvailabilityDto,
  ): Promise<Availability> {
    const slot = await this.availabilityRepository.findOne({
      where: { id: slotId, doctor: { id: doctorId } },
    });
    if (!slot) {
      throw new NotFoundException(`Availability slot ${slotId} not found`);
    }
    Object.assign(slot, dto);
    return await this.availabilityRepository.save(slot);
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
}
