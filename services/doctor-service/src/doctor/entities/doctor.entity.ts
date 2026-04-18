import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Availability } from './availability.entity';
import { Prescription } from '../prescription/entities/prescription.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  specialization: string;

  @Column({ nullable: true })
  qualification: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({
    name: 'consultation_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  consultationFee: number;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Availability, (availability) => availability.doctor, {
    cascade: true,
  })
  availability: Availability[];

  @OneToMany(() => Prescription, (prescription) => prescription.doctor, {
    cascade: true,
  })
  prescriptions: Prescription[];
}
