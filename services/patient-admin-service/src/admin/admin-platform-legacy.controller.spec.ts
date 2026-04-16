import { Test, TestingModule } from '@nestjs/testing';
import { AdminPlatformLegacyController } from './admin-platform-legacy.controller';
import { AdminService } from './admin.service';

describe('AdminPlatformLegacyController', () => {
  let controller: AdminPlatformLegacyController;

  const mockAdminService = {
    getDashboardStats: jest.fn(),
    getAllPatients: jest.fn(),
    updatePatientStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPlatformLegacyController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminPlatformLegacyController>(
      AdminPlatformLegacyController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return dashboard stats for legacy route', async () => {
    const expectedStats = {
      totalPatients: 10,
      totalAdmins: 2,
      recentPatients: [],
    };
    mockAdminService.getDashboardStats.mockResolvedValue(expectedStats);

    const result = await controller.getDashboardStatsLegacy();
    expect(result).toEqual(expectedStats);
    expect(mockAdminService.getDashboardStats).toHaveBeenCalledWith();
  });

  it('should return patient data array for legacy route', async () => {
    const expectedData = [{ id: 'pat-123', name: 'Patient A' }];
    mockAdminService.getAllPatients.mockResolvedValue({
      data: expectedData,
      total: 1,
      page: 1,
      limit: 20,
    });

    const result = await controller.getAllPatientsLegacy();
    expect(result).toEqual(expectedData);
    expect(mockAdminService.getAllPatients).toHaveBeenCalledWith(
      undefined,
      undefined,
      1,
      20,
    );
  });

  it('should update patient status for legacy route', async () => {
    const payload = { status: 'suspended' as const };
    const updatedPatient = { id: 'pat-123', status: 'suspended' };
    mockAdminService.updatePatientStatus.mockResolvedValue(updatedPatient);

    const result = await controller.updatePatientStatusLegacy(
      'pat-123',
      payload,
    );
    expect(result).toEqual(updatedPatient);
    expect(mockAdminService.updatePatientStatus).toHaveBeenCalledWith(
      'pat-123',
      payload,
    );
  });
});
