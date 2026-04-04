import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { ConfigService } from '@nestjs/config';
import { MedicalReport } from './entities/medical-report.entity';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PatientService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(MedicalReport)
    private readonly reportRepository: Repository<MedicalReport>,
    private readonly configService: ConfigService,
  ) {
    // Resolve upload directory relative to the project root
    this.uploadDir = path.resolve(
      process.cwd(),
      this.configService.get<string>('UPLOAD_DIR') || 'uploads/medical-reports',
    );

    // Ensure the directory exists at startup
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
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

  async update(id: string, updatePatientDto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);
    
    let dobDate = patient.dob;
    if (updatePatientDto.dob) {
      dobDate = new Date(updatePatientDto.dob);
    }

    Object.assign(patient, {
      ...updatePatientDto,
      dob: dobDate,
    });

    return await this.patientRepository.save(patient);
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientRepository.remove(patient);
  }

  async uploadReport(patientId: string, title: string, file: Express.Multer.File): Promise<MedicalReport> {
    const patient = await this.findOne(patientId);

    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, uniqueFileName);

    // Write the file buffer to disk
    fs.writeFileSync(filePath, file.buffer);

    // Build a publicly accessible URL
    const baseUrl =
      this.configService.get<string>('APP_BASE_URL') ||
      `http://localhost:${this.configService.get<string>('PORT') || 3005}`;
    const fileUrl = `${baseUrl}/uploads/medical-reports/${uniqueFileName}`;

    const report = this.reportRepository.create({
      patient,
      title,
      fileUrl,
      fileType: file.mimetype,
    });

    return await this.reportRepository.save(report);
  }

  async getReports(patientId: string): Promise<MedicalReport[]> {
    const patient = await this.findOne(patientId);
    return await this.reportRepository.find({
      where: { patient: { id: patient.id } },
      order: { uploadedAt: 'DESC' },
    });
  }

  async getReport(patientId: string, reportId: string): Promise<MedicalReport> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, patient: { id: patientId } },
    });
    if (!report) {
      throw new NotFoundException(`Medical report with ID ${reportId} not found for this patient`);
    }
    return report;
  }

  async deleteReport(patientId: string, reportId: string): Promise<void> {
    const report = await this.getReport(patientId, reportId);

    // Extract the filename from the stored URL and delete the physical file
    try {
      const fileName = path.basename(report.fileUrl);
      const filePath = path.join(this.uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Log but don't block DB deletion if physical file is already gone
      console.warn(`Could not delete file for report ${report.id}`);
    }

    await this.reportRepository.remove(report);
  }
}
