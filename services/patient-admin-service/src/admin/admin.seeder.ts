import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from './entities/admin.entity';

const INITIAL_ADMIN_EMAIL = 'admin@example.com';
const INITIAL_ADMIN_NAME = 'Admin';
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async onApplicationBootstrap() {
    const initialAdminPassword =
      process.env.INITIAL_ADMIN_PASSWORD || 'Pass@123';

    const existing = await this.adminRepository
      .createQueryBuilder('admin')
      .addSelect('admin.passwordHash')
      .where('admin.email = :email', { email: INITIAL_ADMIN_EMAIL })
      .getOne();

    if (existing?.passwordHash) {
      return;
    }

    const passwordHash = await bcrypt.hash(initialAdminPassword, BCRYPT_ROUNDS);

    if (existing) {
      existing.passwordHash = passwordHash;
      await this.adminRepository.save(existing);
      this.logger.log('Initial admin password has been set.');
    } else {
      await this.adminRepository
        .createQueryBuilder()
        .insert()
        .into(Admin)
        .values({
          name: INITIAL_ADMIN_NAME,
          email: INITIAL_ADMIN_EMAIL,
          passwordHash,
        } as any)
        .execute();
      this.logger.log('Initial admin account created.');
    }
  }
}
