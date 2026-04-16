import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Admin } from './entities/admin.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminPlatformLegacyController } from './admin-platform-legacy.controller';
import { AdminSeeder } from './admin.seeder';
import { Patient } from '../patient/entities/patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Patient]), ConfigModule],
  controllers: [AdminController, AdminPlatformLegacyController],
  providers: [AdminService, AdminSeeder],
  exports: [AdminService],
})
export class AdminModule {}
