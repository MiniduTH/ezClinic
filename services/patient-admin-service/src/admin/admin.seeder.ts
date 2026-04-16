import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from './entities/admin.entity';

const INITIAL_ADMIN_EMAIL = 'admin@example.com';
const INITIAL_ADMIN_NAME = 'Admin';
const INITIAL_ADMIN_PASSWORD = 'Pass@123';
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async onApplicationBootstrap() {
    const existing = await this.adminRepository.findOne({
      where: { email: INITIAL_ADMIN_EMAIL },
    });

    if (existing) {
      return;
    }

    const passwordHash = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, BCRYPT_ROUNDS);

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

    this.logger.log(`Initial admin created: ${INITIAL_ADMIN_EMAIL}`);
  }
}
