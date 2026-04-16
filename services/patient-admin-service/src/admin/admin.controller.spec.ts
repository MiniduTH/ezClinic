import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;

  const mockAdminService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getDashboardStats: jest.fn(),
    getAllPatients: jest.fn(),
    updatePatientStatus: jest.fn(),
    getPatientById: jest.fn(),
    deletePatient: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an admin', async () => {
      const createDto = { name: 'Admin One', email: 'admin1@test.com' };
      const expectedResult = { id: 'uuid-123', ...createDto };

      mockAdminService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, {
        user: { sub: 'auth0|test' },
      } as any);
      expect(result).toEqual(expectedResult);
      expect(mockAdminService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of admins', async () => {
      const expectedResult = [
        { id: 'uuid-123', name: 'Admin One', email: 'admin1@test.com' },
      ];
      mockAdminService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();
      expect(result).toEqual(expectedResult);
      expect(mockAdminService.findAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a single admin', async () => {
      const expectedResult = {
        id: 'uuid-123',
        name: 'Admin One',
        email: 'admin1@test.com',
      };
      mockAdminService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('uuid-123');
      expect(result).toEqual(expectedResult);
      expect(mockAdminService.findOne).toHaveBeenCalledWith('uuid-123');
    });
  });

  describe('update', () => {
    it('should update an admin', async () => {
      const updateDto = { name: 'Admin Updated' };
      const expectedResult = {
        id: 'uuid-123',
        name: 'Admin Updated',
        email: 'admin1@test.com',
      };

      mockAdminService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('uuid-123', updateDto);
      expect(result).toEqual(expectedResult);
      expect(mockAdminService.update).toHaveBeenCalledWith(
        'uuid-123',
        updateDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove an admin', async () => {
      mockAdminService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('uuid-123');
      expect(result).toBeUndefined();
      expect(mockAdminService.remove).toHaveBeenCalledWith('uuid-123');
    });
  });

  describe('Platform Operations', () => {
    it('should return dashboard stats', async () => {
      const expectedStats = {
        totalPatients: 10,
        totalAdmins: 2,
        recentPatients: [],
      };
      mockAdminService.getDashboardStats.mockResolvedValue(expectedStats);

      const result = await controller.getDashboardStats();
      expect(result).toEqual(expectedStats);
      expect(mockAdminService.getDashboardStats).toHaveBeenCalledWith();
    });

    it('should return all patients setup for admin view', async () => {
      const expectedPatients = {
        data: [{ id: 'pat-123', name: 'Patient A', medicalReports: [] }],
        total: 1,
        page: 1,
        limit: 20,
      };
      mockAdminService.getAllPatients.mockResolvedValue(expectedPatients);

      const result = await controller.getAllPatients();
      expect(result).toEqual(expectedPatients);
      expect(mockAdminService.getAllPatients).toHaveBeenCalledWith(
        undefined,
        undefined,
        1,
        20,
      );
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

    it('should remove a patient', async () => {
      mockAdminService.deletePatient.mockResolvedValue(undefined);

      const result = await controller.deletePatient('pat-123');
      expect(result).toBeUndefined();
      expect(mockAdminService.deletePatient).toHaveBeenCalledWith('pat-123');
    });
  });
});
