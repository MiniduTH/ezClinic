import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MedicalReport } from './medical-report.entity';

export type PatientStatus = 'active' | 'inactive' | 'suspended';

@Entity('patients')
export class Patient {
  /** Auth0 sub — e.g. "auth0|69dbd034853a0d3ffe6c8ff1" */
  @PrimaryColumn({ name: 'id' })
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  // Medical profile fields
  @Column({ name: 'blood_type', nullable: true })
  bloodType: string;

  @Column({ type: 'text', nullable: true })
  allergies: string;

  @Column({ name: 'emergency_contact', type: 'text', nullable: true })
  emergencyContact: string;

  // Account status: active | inactive | suspended
  @Column({ default: 'active' })
  status: PatientStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => MedicalReport, (report) => report.patient, {
    cascade: true,
  })
  medicalReports: MedicalReport[];
}
