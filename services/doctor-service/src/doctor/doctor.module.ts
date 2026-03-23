import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { Doctor } from './entities/doctor.entity';
import { Availability } from './entities/availability.entity';
import { PrescriptionModule } from './prescription/prescription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, Availability]),
    PrescriptionModule,
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
