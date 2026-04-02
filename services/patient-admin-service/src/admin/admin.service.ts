import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Patient } from '../patient/entities/patient.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  // ─── Admin CRUD ───────────────────────────────────────────────

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const existing = await this.adminRepository.findOne({
      where: { email: createAdminDto.email },
    });

    if (existing) {
      throw new ConflictException('Admin with this email already exists');
    }

    const admin = this.adminRepository.create(createAdminDto);
    return await this.adminRepository.save(admin);
  }

  async findAll(): Promise<Admin[]> {
    return await this.adminRepository.find();
  }

  async findOne(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    const admin = await this.findOne(id);
    Object.assign(admin, updateAdminDto);
    return await this.adminRepository.save(admin);
  }

  async remove(id: string): Promise<void> {
    const admin = await this.findOne(id);
    await this.adminRepository.remove(admin);
  }

  // ─── Platform Operations: User Management ─────────────────────

  /**
   * Get all patients (user management for admin dashboard)
   */
  async getAllPatients(): Promise<Patient[]> {
    return await this.patientRepository.find({
      relations: ['medicalReports'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single patient by ID (admin view with full details)
   */
  async getPatientById(patientId: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['medicalReports'],
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }
    return patient;
  }

  /**
   * Delete a patient account (admin operation)
   */
  async deletePatient(patientId: string): Promise<void> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }
    await this.patientRepository.remove(patient);
  }

  // ─── Platform Operations: Dashboard Stats ─────────────────────

  /**
   * Get platform statistics for the admin dashboard
   */
  async getDashboardStats(): Promise<{
    totalPatients: number;
    totalAdmins: number;
    recentPatients: Patient[];
  }> {
    const totalPatients = await this.patientRepository.count();
    const totalAdmins = await this.adminRepository.count();

    const recentPatients = await this.patientRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      totalPatients,
      totalAdmins,
      recentPatients,
    };
  }
}
