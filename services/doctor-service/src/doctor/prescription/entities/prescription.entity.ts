import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Doctor } from '../../entities/doctor.entity';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.prescriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'appointment_id' })
  appointmentId: string;

  @Column({ type: 'jsonb' })
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'issued_at' })
  issuedAt: Date;
}
