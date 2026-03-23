import { Patient } from './patient.entity';
export declare class MedicalReport {
    id: string;
    patient: Patient;
    title: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: Date;
}
