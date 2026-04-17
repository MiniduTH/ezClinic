import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';

export type ReportType = 'lab' | 'imaging' | 'prescription' | 'other';

@Entity('medical_reports')
export class MedicalReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, (patient) => patient.medicalReports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column()
  title: string;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'file_type', nullable: true })
  fileType: string;

  // Size of the uploaded file in bytes
  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  // Categorical type for filtering
  @Column({ name: 'report_type', default: 'other' })
  reportType: ReportType;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Date the report was actually issued (not the upload date)
  @Column({ name: 'report_date', type: 'date', nullable: true })
  reportDate: Date;

  // Soft-delete flag — rows are kept in DB for audit purposes
  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
