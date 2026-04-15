import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class PatientIntegrationService {
  private readonly logger = new Logger(PatientIntegrationService.name);
  private readonly axiosInstance: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseUrl = this.configService.get<string>(
      'PATIENT_SERVICE_URL',
      'http://localhost:3005',
    );
    this.axiosInstance = axios.create({
      baseURL: `${baseUrl}/api/v1`,
      timeout: 5000,
    });
  }

  async getPatientById(patientId: string) {
    try {
      this.logger.log(`Fetching patient details for ID: ${patientId}`);
      const response = await this.axiosInstance.get(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch patient details: ${error.message}`);
      throw error;
    }
  }

  async getPatientReports(patientId: string) {
    try {
      this.logger.log(`Fetching medical reports for patient: ${patientId}`);
      const response = await this.axiosInstance.get(
        `/patients/${patientId}/reports`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch patient reports: ${error.message}`);
      throw error;
    }
  }
}
