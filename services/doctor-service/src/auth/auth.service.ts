import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Doctor, DoctorDocument } from '../doctor/schemas/doctor.schema';
import { RegisterDoctorDto, LoginDto } from './dto/auth.dto';

const ROLES_CLAIM = 'https://ezclinic.com/roles';
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Doctor.name)
    private readonly doctorModel: Model<DoctorDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDoctorDto) {
    const existing = await this.doctorModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const id = uuidv4();

    const doctor = await this.doctorModel.create({
      _id: id,
      name: dto.name,
      email: dto.email.toLowerCase(),
      specialization: dto.specialization,
      qualification: dto.qualification,
      bio: dto.bio,
      consultationFee: dto.consultationFee ?? 0,
      passwordHash,
    });

    const token = this.issueToken(id, doctor.name, doctor.email);
    return {
      token,
      user: this.publicUser(doctor.toObject()),
    };
  }

  async login(dto: LoginDto) {
    const doctor = await this.doctorModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+passwordHash');

    if (!doctor || !doctor.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, doctor.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const id = (doctor as any)._id as string;
    const token = this.issueToken(id, doctor.name, doctor.email);
    return {
      token,
      user: this.publicUser(doctor.toObject()),
    };
  }

  private issueToken(id: string, name: string, email: string): string {
    return this.jwtService.sign({
      sub: id,
      email,
      name,
      role: 'doctor',
      [ROLES_CLAIM]: ['doctor'],
    });
  }

  private publicUser(doc: any) {
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    const { passwordHash: _pw, ...rest } = obj;
    return { ...rest, id: rest._id };
  }
}
