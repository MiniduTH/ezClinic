import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppointmentIntegrationService } from './appointment.integration.service';
import { PatientIntegrationService } from './patient.integration.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AppointmentIntegrationService, PatientIntegrationService],
  exports: [AppointmentIntegrationService, PatientIntegrationService],
})
export class IntegrationModule {}
