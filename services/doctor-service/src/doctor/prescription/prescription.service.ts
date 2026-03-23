import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './entities/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
  ) {}

  async create(
    doctorId: string,
    dto: CreatePrescriptionDto,
  ): Promise<Prescription> {
    const prescription = this.prescriptionRepository.create({
      doctor: { id: doctorId } as any,
      patientId: dto.patientId,
      appointmentId: dto.appointmentId,
      medications: dto.medications,
      notes: dto.notes,
    });
    return await this.prescriptionRepository.save(prescription);
  }

  async findByDoctor(doctorId: string, page = 1, limit = 10) {
    const [data, totalItems] = await this.prescriptionRepository.findAndCount({
      where: { doctor: { id: doctorId } },
      order: { issuedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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

  async findByPatient(patientId: string, page = 1, limit = 10) {
    const [data, totalItems] = await this.prescriptionRepository.findAndCount({
      where: { patientId },
      relations: ['doctor'],
      order: { issuedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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

  async findOne(id: string): Promise<Prescription> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id },
      relations: ['doctor'],
    });
    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }
    return prescription;
  }
}
