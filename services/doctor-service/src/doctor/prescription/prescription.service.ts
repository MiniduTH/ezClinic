import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

  private wrap(data: any, message?: string) {
    return {
      success: true,
      data,
      ...(message && { message }),
    };
  }

  async create(doctorId: string, dto: CreatePrescriptionDto) {
    // Validate at least one medication
    if (!dto.medications || dto.medications.length === 0) {
      throw new BadRequestException(
        'A prescription must include at least one medication.',
      );
    }

    // Parse follow-up date if provided
    let followUpDate: Date | undefined = undefined;
    if (dto.followUpDate) {
      followUpDate = new Date(dto.followUpDate);
      if (followUpDate <= new Date()) {
        throw new BadRequestException(
          'Follow-up date must be in the future.',
        );
      }
    }

    const prescription = this.prescriptionRepository.create({
      doctor: { id: doctorId } as any,
      patientId: dto.patientId,
      patientName: dto.patientName,
      appointmentId: dto.appointmentId,
      diagnosis: dto.diagnosis,
      medications: dto.medications,
      notes: dto.notes,
      followUpDate,
    });

    const saved = await this.prescriptionRepository.save(prescription);

    // Generate a human-readable prescription summary
    const summary = this.generatePrescriptionSummary(saved);

    return this.wrap(
      { prescription: saved, summary },
      'Prescription issued successfully.',
    );
  }

  async findByDoctor(doctorId: string, page = 1, limit = 10) {
    const [data, totalItems] = await this.prescriptionRepository.findAndCount({
      where: { doctor: { id: doctorId } },
      order: { issuedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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

  async findByPatient(patientId: string, page = 1, limit = 10) {
    const [data, totalItems] = await this.prescriptionRepository.findAndCount({
      where: { patientId },
      relations: ['doctor'],
      order: { issuedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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

  async findByAppointment(appointmentId: string) {
    const prescription = await this.prescriptionRepository.findOne({
      where: { appointmentId },
      relations: ['doctor'],
    });
    if (!prescription) {
      throw new NotFoundException(
        `No prescription found for appointment ${appointmentId}`,
      );
    }

    const summary = this.generatePrescriptionSummary(prescription);
    return this.wrap({ prescription, summary });
  }

  async findOne(id: string) {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id },
      relations: ['doctor'],
    });
    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }

    const summary = this.generatePrescriptionSummary(prescription);
    return this.wrap({ prescription, summary });
  }

  // ─── Prescription Summary Generation ──────────────────────────────

  /**
   * Generates a human-readable text summary of a prescription,
   * suitable for display in the UI or for printing/PDF export.
   */
  private generatePrescriptionSummary(prescription: Prescription): string {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════');
    lines.push('          DIGITAL PRESCRIPTION');
    lines.push('             ezClinic');
    lines.push('═══════════════════════════════════════════');
    lines.push('');

    // Patient info
    if (prescription.patientName) {
      lines.push(`Patient:       ${prescription.patientName}`);
    }
    lines.push(`Patient ID:    ${prescription.patientId}`);
    lines.push(
      `Date Issued:   ${new Date(prescription.issuedAt).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    );
    lines.push('');

    // Diagnosis
    if (prescription.diagnosis) {
      lines.push(`Diagnosis:     ${prescription.diagnosis}`);
      lines.push('');
    }

    // Medications table
    lines.push('───────────────────────────────────────────');
    lines.push(' MEDICATIONS');
    lines.push('───────────────────────────────────────────');

    prescription.medications.forEach((med, i) => {
      lines.push(`  ${i + 1}. ${med.name}`);
      lines.push(`     Dosage:    ${med.dosage}`);
      lines.push(`     Frequency: ${med.frequency}`);
      lines.push(`     Duration:  ${med.duration}`);
      lines.push('');
    });

    // Notes
    if (prescription.notes) {
      lines.push('───────────────────────────────────────────');
      lines.push(' NOTES');
      lines.push('───────────────────────────────────────────');
      lines.push(`  ${prescription.notes}`);
      lines.push('');
    }

    // Follow-up
    if (prescription.followUpDate) {
      lines.push(
        `Follow-up:     ${new Date(prescription.followUpDate).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      );
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════');
    lines.push(' This is a digitally generated prescription.');
    lines.push(' Verified by ezClinic platform.');
    lines.push('═══════════════════════════════════════════');

    return lines.join('\n');
  }
}
