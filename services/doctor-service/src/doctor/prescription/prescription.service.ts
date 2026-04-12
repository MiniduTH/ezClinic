import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Prescription, PrescriptionDocument } from '../schemas/prescription.schema';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectModel(Prescription.name)
    private readonly prescriptionModel: Model<PrescriptionDocument>,
  ) { }

  private wrap(data: any, message?: string) {
    return { success: true, data, ...(message && { message }) };
  }

  async create(doctorId: string, dto: CreatePrescriptionDto) {
    if (!Types.ObjectId.isValid(doctorId)) {
      throw new BadRequestException('Invalid doctor ID format. Must be a 24-character hex string.');
    }

    if (!dto.medications || dto.medications.length === 0) {
      throw new BadRequestException('A prescription must include at least one medication.');
    }

    let followUpDate: Date | undefined;
    if (dto.followUpDate) {
      followUpDate = new Date(dto.followUpDate);
      if (followUpDate <= new Date()) {
        throw new BadRequestException('Follow-up date must be in the future.');
      }
    }

    const prescription = await this.prescriptionModel.create({
      doctorId: new Types.ObjectId(doctorId),
      patientId: dto.patientId,
      patientName: dto.patientName,
      appointmentId: dto.appointmentId,
      diagnosis: dto.diagnosis,
      medications: dto.medications,
      notes: dto.notes,
      followUpDate,
    });

    const summary = this.generatePrescriptionSummary(prescription);
    return this.wrap({ prescription, summary }, 'Prescription issued successfully.');
  }

  async findByDoctor(doctorId: string, page = 1, limit = 10) {
    const filter = { doctorId: new Types.ObjectId(doctorId) };
    const [data, totalItems] = await Promise.all([
      this.prescriptionModel.find(filter).sort({ issuedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.prescriptionModel.countDocuments(filter),
    ]);
    return {
      success: true,
      data,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    };
  }

  async findByPatient(patientId: string, page = 1, limit = 10) {
    const filter = { patientId };
    const [data, totalItems] = await Promise.all([
      this.prescriptionModel.find(filter).populate('doctorId', 'name email specialization').sort({ issuedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.prescriptionModel.countDocuments(filter),
    ]);
    return {
      success: true,
      data,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    };
  }

  async findByAppointment(appointmentId: string) {
    const prescription = await this.prescriptionModel
      .findOne({ appointmentId })
      .populate('doctorId', 'name email specialization')
      .lean();
    if (!prescription) throw new NotFoundException(`No prescription found for appointment ${appointmentId}`);
    const summary = this.generatePrescriptionSummary(prescription as any);
    return this.wrap({ prescription, summary });
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException(`Prescription ${id} not found`);
    const prescription = await this.prescriptionModel
      .findById(id)
      .populate('doctorId', 'name email specialization')
      .lean();
    if (!prescription) throw new NotFoundException(`Prescription with ID ${id} not found`);
    const summary = this.generatePrescriptionSummary(prescription as any);
    return this.wrap({ prescription, summary });
  }

  // ─── Prescription Summary Generation ──────────────────────────────

  private generatePrescriptionSummary(prescription: any): string {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════');
    lines.push('          DIGITAL PRESCRIPTION');
    lines.push('             ezClinic');
    lines.push('═══════════════════════════════════════════');
    lines.push('');
    if (prescription.patientName) lines.push(`Patient:       ${prescription.patientName}`);
    lines.push(`Patient ID:    ${prescription.patientId}`);
    const issuedDate = prescription.issuedAt || prescription.createdAt || new Date();
    lines.push(`Date Issued:   ${new Date(issuedDate).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    lines.push('');
    if (prescription.diagnosis) {
      lines.push(`Diagnosis:     ${prescription.diagnosis}`);
      lines.push('');
    }
    lines.push('───────────────────────────────────────────');
    lines.push(' MEDICATIONS');
    lines.push('───────────────────────────────────────────');
    (prescription.medications || []).forEach((med: any, i: number) => {
      lines.push(`  ${i + 1}. ${med.name}`);
      lines.push(`     Dosage:    ${med.dosage}`);
      lines.push(`     Frequency: ${med.frequency}`);
      lines.push(`     Duration:  ${med.duration}`);
      lines.push('');
    });
    if (prescription.notes) {
      lines.push('───────────────────────────────────────────');
      lines.push(' NOTES');
      lines.push('───────────────────────────────────────────');
      lines.push(`  ${prescription.notes}`);
      lines.push('');
    }
    if (prescription.followUpDate) {
      lines.push(`Follow-up:     ${new Date(prescription.followUpDate).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}`);
      lines.push('');
    }
    lines.push('═══════════════════════════════════════════');
    lines.push(' This is a digitally generated prescription.');
    lines.push(' Verified by ezClinic platform.');
    lines.push('═══════════════════════════════════════════');
    return lines.join('\n');
  }
}
