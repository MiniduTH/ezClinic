import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Patient } from '../patient/entities/patient.entity';
import { Admin } from '../admin/entities/admin.entity';
import { RegisterPatientDto, LoginDto } from './dto/auth.dto';

const ROLES_CLAIM = 'https://ezclinic.com/roles';
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterPatientDto) {
    const existing = await this.patientRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const id = uuidv4();

    // Use insert to bypass select:false on passwordHash
    await this.patientRepository
      .createQueryBuilder()
      .insert()
      .into(Patient)
      .values({
        id,
        name: dto.name,
        email: dto.email.toLowerCase(),
        phone: dto.phone ?? null,
        dob: dto.dob ? new Date(dto.dob) : null,
        gender: dto.gender ?? null,
        passwordHash,
      } as any)
      .execute();

    const saved = await this.patientRepository.findOneOrFail({ where: { id } });

    const token = this.issueToken(saved);
    return { token, user: this.publicUser(saved) };
  }

  async login(dto: LoginDto) {
    const patient = await this.patientRepository
      .createQueryBuilder('patient')
      .addSelect('patient.passwordHash')
      .where('patient.email = :email', { email: dto.email.toLowerCase() })
      .getOne();

    if (!patient || !patient.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, patient.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.issueToken(patient);
    return { token, user: this.publicUser(patient) };
  }

  async loginAdmin(dto: LoginDto) {
    const admin = await this.adminRepository
      .createQueryBuilder('admin')
      .addSelect('admin.passwordHash')
      .where('admin.email = :email', { email: dto.email.toLowerCase() })
      .getOne();

    if (!admin || !admin.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.issueAdminToken(admin);
    return { token, user: this.publicAdmin(admin) };
  }

  private issueToken(patient: Patient): string {
    return this.jwtService.sign({
      sub: patient.id,
      email: patient.email,
      name: patient.name,
      role: 'patient',
      [ROLES_CLAIM]: ['patient'],
    });
  }

  private issueAdminToken(admin: Admin): string {
    return this.jwtService.sign({
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'admin',
      [ROLES_CLAIM]: ['admin'],
    });
  }

  private publicUser(patient: Patient) {
    const { passwordHash: _pw, ...rest } = patient as any;
    return rest;
  }

  private publicAdmin(admin: Admin) {
    const { passwordHash: _pw, ...rest } = admin as any;
    return rest;
  }
}
