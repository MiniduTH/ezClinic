import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientModule } from './patient/patient.module';
import { AdminModule } from './admin/admin.module';
import { Patient } from './patient/entities/patient.entity';
import { MedicalReport } from './patient/entities/medical-report.entity';
import { Admin } from './admin/entities/admin.entity';
import { AppController } from './app.controller';

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
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        ssl: config.get<string>('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),

    PatientModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
