import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadGatewayException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { Patient } from '../patient/entities/patient.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly configService: ConfigService,
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
   * Get all patients (user management for admin dashboard).
   * Supports optional free-text search on name or email.
   */
  async getAllPatients(search?: string, status?: string, page = 1, limit = 20): Promise<{ data: Patient[]; total: number; page: number; limit: number }> {
    const query = this.patientRepository.createQueryBuilder('p')
      .leftJoinAndSelect('p.medicalReports', 'r', 'r.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.where('p.name ILIKE :search OR p.email ILIKE :search', { search: `%${search}%` });
    }
    if (status) {
      query.andWhere('p.status = :status', { status });
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
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
   * Update a patient's account status (active | inactive | suspended).
   */
  async updatePatientStatus(patientId: string, dto: UpdateUserStatusDto): Promise<Patient> {
    const patient = await this.patientRepository.findOne({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }
    patient.status = dto.status;
    return await this.patientRepository.save(patient);
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
   * Extended platform statistics for the admin dashboard.
   */
  async getDashboardStats(): Promise<{
    totalPatients: number;
    activePatients: number;
    suspendedPatients: number;
    totalAdmins: number;
    newPatientsThisWeek: number;
    recentPatients: Patient[];
  }> {
    const totalPatients = await this.patientRepository.count();
    const activePatients = await this.patientRepository.count({ where: { status: 'active' } });
    const suspendedPatients = await this.patientRepository.count({ where: { status: 'suspended' } });
    const totalAdmins = await this.adminRepository.count();

    // Count patients registered in the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newPatientsThisWeek = await this.patientRepository
      .createQueryBuilder('p')
      .where('p.createdAt >= :weekAgo', { weekAgo })
      .getCount();

    const recentPatients = await this.patientRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      totalPatients,
      activePatients,
      suspendedPatients,
      totalAdmins,
      newPatientsThisWeek,
      recentPatients,
    };
  }

  // ─── Doctor Verification (proxy to doctor-service) ─────────────

  private get doctorServiceUrl(): string {
    return this.configService.get<string>('DOCTOR_SERVICE_URL') || 'http://localhost:3002/api/v1';
  }

  async getPendingDoctors(authorizationHeader: string): Promise<unknown> {
    const url = `${this.doctorServiceUrl}/doctors?isVerified=false`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: authorizationHeader },
      });
      if (!res.ok) throw new BadGatewayException('doctor-service returned ' + res.status);
      return res.json();
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      throw new BadGatewayException('Could not reach doctor-service');
    }
  }

  async verifyDoctor(doctorId: string, action: 'approve' | 'reject', authorizationHeader: string, reason?: string): Promise<unknown> {
    const url = `${this.doctorServiceUrl}/doctors/${doctorId}/verify`;
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: authorizationHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) throw new BadGatewayException('doctor-service returned ' + res.status);
      return res.json();
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      throw new BadGatewayException('Could not reach doctor-service');
    }
  }
}
