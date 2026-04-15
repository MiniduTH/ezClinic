import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Prescription, PrescriptionSchema } from '../schemas/prescription.schema';
import { PrescriptionService } from './prescription.service';
import { PrescriptionController } from './prescription.controller';
import { PatientIntegrationService } from '../integration/patient.integration.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    MongooseModule.forFeature([{ name: Prescription.name, schema: PrescriptionSchema }]),
  ],
  controllers: [PrescriptionController],
  providers: [PrescriptionService, PatientIntegrationService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}
