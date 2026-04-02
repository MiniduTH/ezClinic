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
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(MedicalReport)
    private readonly reportRepository: Repository<MedicalReport>,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: this.configService.get<string>('R2_ENDPOINT') || '',
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  private readonly s3Client: S3Client;

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
    
    // Upload to Cloudflare R2
    const bucketName = this.configService.get<string>('R2_BUCKET_NAME');
    await this.s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueFileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');
    const fileUrl = `${publicUrl}/${uniqueFileName}`;

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
    
    // In a real scenario, you'd also want to delete the file from Cloudflare R2
    // using DeleteObjectCommand from @aws-sdk/client-s3

    await this.reportRepository.remove(report);
  }
}
