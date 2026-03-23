import { MedicalReport } from './medical-report.entity';
export declare class Patient {
    id: string;
    auth0Id: string;
    name: string;
    email: string;
    phone: string;
    dob: Date;
    gender: string;
    address: string;
    avatarUrl: string;
    createdAt: Date;
    medicalReports: MedicalReport[];
}
