import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { Doctor, DoctorSchema } from './schemas/doctor.schema';
import { Availability, AvailabilitySchema } from './schemas/availability.schema';
import { Prescription, PrescriptionSchema } from './schemas/prescription.schema';
import { PrescriptionModule } from './prescription/prescription.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Doctor.name, schema: DoctorSchema },
      { name: Availability.name, schema: AvailabilitySchema },
      { name: Prescription.name, schema: PrescriptionSchema },
    ]),
    PrescriptionModule,
    AuthModule,
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
