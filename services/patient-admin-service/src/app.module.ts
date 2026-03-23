import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientModule } from './patient/patient.module';
import { AdminModule } from './admin/admin.module';
import { Patient } from './patient/entities/patient.entity';
import { MedicalReport } from './patient/entities/medical-report.entity';
import { Admin } from './admin/entities/admin.entity';

@Module({
  imports: [
    // Load .env file globally
    ConfigModule.forRoot({ isGlobal: true }),

    // TypeORM connected to Supabase (PostgreSQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'ezclnic_patient_db'),
        entities: [Patient, MedicalReport, Admin],
        synchronize: config.get<string>('NODE_ENV') !== 'production', // Auto-migrate in dev only
        ssl: config.get<string>('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),

    PatientModule,
    AdminModule,
  ],
})
export class AppModule {}
