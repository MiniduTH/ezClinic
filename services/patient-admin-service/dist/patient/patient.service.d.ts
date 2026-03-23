import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
export declare class PatientService {
    private readonly patientRepository;
    constructor(patientRepository: Repository<Patient>);
    create(createPatientDto: CreatePatientDto): Promise<Patient>;
    findAll(): Promise<Patient[]>;
    findOne(id: string): Promise<Patient>;
    update(id: string, updatePatientDto: UpdatePatientDto): Promise<Patient>;
    remove(id: string): Promise<void>;
}
