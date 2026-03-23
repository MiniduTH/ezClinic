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

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

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
}
