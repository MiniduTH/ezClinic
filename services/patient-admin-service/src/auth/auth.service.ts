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
import { RegisterPatientDto, LoginDto } from './dto/auth.dto';

const ROLES_CLAIM = 'https://ezclinic.com/roles';
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
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

    const patientData: Partial<Patient> = {
      id,
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      dob: dto.dob ? new Date(dto.dob) : undefined,
      gender: dto.gender,
    };

    const patient = this.patientRepository.create(patientData as Patient);
    // Set passwordHash using direct assignment to bypass select: false
    (patient as any).passwordHash = passwordHash;

    const saved = await this.patientRepository.save(patient);

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

  private issueToken(patient: Patient): string {
    return this.jwtService.sign({
      sub: patient.id,
      email: patient.email,
      name: patient.name,
      role: 'patient',
      [ROLES_CLAIM]: ['patient'],
    });
  }

  private publicUser(patient: Patient) {
    const { passwordHash: _pw, ...rest } = patient as any;
    return rest;
  }
}
