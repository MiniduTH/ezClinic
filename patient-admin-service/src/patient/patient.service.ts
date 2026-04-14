import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UploadReportDto } from './dto/upload-report.dto';
import { MedicalReport, ReportType } from './entities/medical-report.entity';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

// Allowed MIME types for medical report uploads
const ALLOWED_REPORT_MIMES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
// Allowed MIME types for avatar uploads
const ALLOWED_AVATAR_MIMES = new Set(['image/jpeg', 'image/png']);
const MAX_REPORT_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;  // 2 MB

export interface ReportFilter {
  reportType?: ReportType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedReports {
  data: MedicalReport[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class PatientService {
  private readonly uploadDir: string;
  private readonly avatarDir: string;

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(MedicalReport)
    private readonly reportRepository: Repository<MedicalReport>,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = path.resolve(
      process.cwd(),
      this.configService.get<string>('UPLOAD_DIR') || 'uploads/medical-reports',
    );
    this.avatarDir = path.resolve(process.cwd(), 'uploads/avatars');

    for (const dir of [this.uploadDir, this.avatarDir]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    // Check if a patient with the given email already exists
    const existingPatient = await this.patientRepository.findOne({
      where: { email: createPatientDto.email },
    });

    if (existingPatient) {
      throw new ConflictException('Patient with this email already exists');
    }

    // Process DOB string to Date object if provided
    let dobDate: Date | undefined = undefined;
    if (createPatientDto.dob) {
      dobDate = new Date(createPatientDto.dob);
    }

    // Create the new patient
    const newPatient = this.patientRepository.create({
      ...createPatientDto,
      dob: dobDate,
    });

    // Save and return the new patient record
    return await this.patientRepository.save(newPatient);
  }

  async findAll(): Promise<Patient[]> {
    return await this.patientRepository.find();
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
    return patient;
  }

  async findByAuth0Id(auth0Id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({ where: { auth0Id } });
    if (!patient) {
      throw new NotFoundException(`Patient with Auth0 ID not found`);
    }
    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);
    
    let dobDate: any = patient.dob;
    if (updatePatientDto.dob !== undefined) {
      dobDate = updatePatientDto.dob === null ? null : new Date(updatePatientDto.dob);
    }

    Object.assign(patient, {
      ...updatePatientDto,
    });
    
    if (updatePatientDto.dob !== undefined) {
       patient.dob = dobDate;
    }

    return await this.patientRepository.save(patient);
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientRepository.remove(patient);
  }

  /**
   * Update the profile of the currently authenticated patient using their Auth0 sub.
   */
  async updateMe(auth0Id: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findByAuth0Id(auth0Id);
    return this.update(patient.id, dto);
  }

  // ─── Avatar Upload ─────────────────────────────────────────────

  /**
   * Upload or replace the avatar for the authenticated patient.
   * Only JPEG / PNG accepted; max 2 MB.
   */
  async uploadAvatar(auth0Id: string, file: Express.Multer.File): Promise<Patient> {
    if (!ALLOWED_AVATAR_MIMES.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG and PNG images are accepted for avatars');
    }
    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException('Avatar file must be under 2 MB');
    }

    const patient = await this.findByAuth0Id(auth0Id);

    // Remove old avatar file if stored locally
    if (patient.avatarUrl) {
      try {
        const oldName = path.basename(patient.avatarUrl);
        const oldPath = path.join(this.avatarDir, oldName);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch {
        // Non-fatal
      }
    }

    const ext = path.extname(file.originalname) || (file.mimetype === 'image/png' ? '.png' : '.jpg');
    const uniqueName = `${uuidv4()}${ext}`;
    fs.writeFileSync(path.join(this.avatarDir, uniqueName), file.buffer);

    const baseUrl =
      this.configService.get<string>('APP_BASE_URL') ||
      `http://localhost:${this.configService.get<string>('PORT') || 3005}`;
    patient.avatarUrl = `${baseUrl}/uploads/avatars/${uniqueName}`;

    return await this.patientRepository.save(patient);
  }

  // ─── Medical Reports ───────────────────────────────────────────

  /**
   * Upload a medical report. Validates MIME type (PDF, JPEG, PNG) and size (max 10 MB).
   */
  async uploadReport(
    patientId: string,
    dto: UploadReportDto,
    file: Express.Multer.File,
  ): Promise<MedicalReport> {
    if (!ALLOWED_REPORT_MIMES.has(file.mimetype)) {
      throw new BadRequestException(
        'Only PDF, JPEG, and PNG files are accepted for medical reports',
      );
    }
    if (file.size > MAX_REPORT_SIZE) {
      throw new BadRequestException('Report file must be under 10 MB');
    }

    const patient = await this.findOne(patientId);

    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    fs.writeFileSync(path.join(this.uploadDir, uniqueFileName), file.buffer);

    const baseUrl =
      this.configService.get<string>('APP_BASE_URL') ||
      `http://localhost:${this.configService.get<string>('PORT') || 3005}`;
    const fileUrl = `${baseUrl}/uploads/medical-reports/${uniqueFileName}`;

    const report = this.reportRepository.create({
      patient,
      title: dto.title,
      fileUrl,
      fileType: file.mimetype,
      fileSize: file.size,
      reportType: dto.reportType ?? 'other',
      description: dto.description,
      reportDate: dto.reportDate ? new Date(dto.reportDate) : undefined,
    });

    return await this.reportRepository.save(report);
  }

  /**
   * List reports for a patient with optional type/date filters and pagination.
   * Soft-deleted reports are excluded.
   */
  async getReports(patientId: string, filter: ReportFilter = {}): Promise<PaginatedReports> {
    await this.findOne(patientId); // verify patient exists

    const { reportType, dateFrom, dateTo, page = 1, limit = 20 } = filter;

    const qb = this.reportRepository
      .createQueryBuilder('r')
      .where('r.patient_id = :patientId', { patientId })
      .andWhere('r.is_deleted = false');

    if (reportType) {
      qb.andWhere('r.report_type = :reportType', { reportType });
    }
    if (dateFrom) {
      qb.andWhere('r.uploaded_at >= :dateFrom', { dateFrom: new Date(dateFrom) });
    }
    if (dateTo) {
      qb.andWhere('r.uploaded_at <= :dateTo', { dateTo: new Date(dateTo) });
    }

    const total = await qb.getCount();
    const data = await qb
      .orderBy('r.uploaded_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page, limit };
  }

  async getReport(patientId: string, reportId: string): Promise<MedicalReport> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, patient: { id: patientId }, isDeleted: false },
    });
    if (!report) {
      throw new NotFoundException(`Medical report with ID ${reportId} not found for this patient`);
    }
    return report;
  }

  /**
   * Soft-delete a report — sets isDeleted=true; removes the physical file to free storage.
   */
  async deleteReport(patientId: string, reportId: string): Promise<void> {
    const report = await this.getReport(patientId, reportId);

    try {
      const fileName = path.basename(report.fileUrl);
      const filePath = path.join(this.uploadDir, fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // Non-fatal: continue with soft-delete even if the file is already gone
    }

    report.isDeleted = true;
    await this.reportRepository.save(report);
  }
}
