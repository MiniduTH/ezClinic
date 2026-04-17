import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class AppointmentIntegrationService {
  private readonly logger = new Logger(AppointmentIntegrationService.name);
  private readonly axiosInstance: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseUrl = this.configService.get<string>(
      'APPOINTMENT_SERVICE_URL',
      'http://localhost:3004',
    );
    this.axiosInstance = axios.create({
      baseURL: `${baseUrl}/api/v1`,
      timeout: 5000,
    });
  }

  async getAppointmentsByDoctor(doctorId: string) {
    try {
      this.logger.log(`Fetching appointments for doctor: ${doctorId}`);
      const response = await this.axiosInstance.get(
        `/appointments/doctor/${doctorId}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch appointments: ${error.message}`);
      throw error;
    }
  }

  async updateAppointmentStatus(appointmentId: string, status: string) {
    try {
      this.logger.log(
        `Updating appointment ${appointmentId} to status: ${status}`,
      );
      const response = await this.axiosInstance.patch(
        `/appointments/${appointmentId}/status`,
        { status },
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to update appointment status: ${error.message}`,
      );
      throw error;
    }
  }
}
