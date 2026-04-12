import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientModule } from './patient/patient.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
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
        url: config.get<string>('DATABASE_URL'),
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
    AuthModule,
  ],
})
export class AppModule {}
