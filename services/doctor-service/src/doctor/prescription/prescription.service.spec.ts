import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PrescriptionService } from './prescription.service';
import { Prescription } from '../schemas/prescription.schema';
import { PatientIntegrationService } from '../integration/patient.integration.service';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const doctorId = new Types.ObjectId().toHexString();
const patientId = 'patient-abc-123';
const appointmentId = 'appt-xyz-456';

const validDto = {
    patientId,
    appointmentId,
    patientName: 'Nethmi Perera',
    diagnosis: 'Mild Hypertension',
    medications: [
        { name: 'Aspirin 75mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days' },
    ],
    notes: 'Avoid salt',
    followUpDate: '2027-01-01',
};

function makePrescription(overrides: Partial<any> = {}) {
    return {
        _id: new Types.ObjectId(),
        doctorId: new Types.ObjectId(doctorId),
        ...validDto,
        issuedAt: new Date(),
        ...overrides,
    };
}

// â”€â”€â”€ Mocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mockModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
};

const mockPatientIntegration = {
    getPatientById: jest.fn(),
};

// â”€â”€â”€ Suite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('PrescriptionService', () => {
    let service: PrescriptionService;

    beforeEach(async () => {
        jest.clearAllMocks();
        // Default: patient exists
        mockPatientIntegration.getPatientById.mockResolvedValue({ id: patientId, name: 'Nethmi Perera' });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PrescriptionService,
                { provide: getModelToken(Prescription.name), useValue: mockModel },
                { provide: PatientIntegrationService, useValue: mockPatientIntegration },
            ],
        }).compile();

        service = module.get<PrescriptionService>(PrescriptionService);
    });

    // â”€â”€â”€ create â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('create', () => {
        it('creates a prescription and returns a summary', async () => {
            const rx = makePrescription();
            mockModel.create.mockResolvedValue(rx);

            const result = await service.create(doctorId, validDto as any);
            expect(result.success).toBe(true);
            expect(result.data.prescription).toBe(rx);
            expect(typeof result.data.summary).toBe('string');
            expect(result.data.summary).toContain('DIGITAL PRESCRIPTION');
        });

        it('throws BadRequestException for empty medications array', async () => {
            await expect(
                service.create(doctorId, { ...validDto, medications: [] } as any),
            ).rejects.toThrow(BadRequestException);
        });

        it('throws BadRequestException for past follow-up date', async () => {
            await expect(
                service.create(doctorId, { ...validDto, followUpDate: '2020-01-01' } as any),
            ).rejects.toThrow(BadRequestException);
        });

        it('throws BadRequestException for invalid doctorId format', async () => {
            await expect(
                service.create('not-a-valid-id', validDto as any),
            ).rejects.toThrow(BadRequestException);
        });

        it('still creates prescription when patient service is unavailable', async () => {
            mockPatientIntegration.getPatientById.mockRejectedValue(new Error('Service unavailable'));
            const rx = makePrescription();
            mockModel.create.mockResolvedValue(rx);
            const result = await service.create(doctorId, validDto as any);
            expect(result.success).toBe(true);
        });
    });

    // â”€â”€â”€ findByDoctor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('findByDoctor', () => {
        it('returns paginated prescriptions for a doctor', async () => {
            const rxList = [makePrescription()];
            mockModel.find.mockReturnValue({
                sort: () => ({ skip: () => ({ limit: () => ({ lean: () => Promise.resolve(rxList) }) }) }),
            });
            mockModel.countDocuments.mockResolvedValue(1);

            const result = await service.findByDoctor(doctorId);
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.pagination.totalItems).toBe(1);
        });
    });

    // â”€â”€â”€ findByPatient â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('findByPatient', () => {
        it('returns paginated prescriptions for a patient', async () => {
            const rxList = [makePrescription()];
            mockModel.find.mockReturnValue({
                populate: () => ({
                    sort: () => ({ skip: () => ({ limit: () => ({ lean: () => Promise.resolve(rxList) }) }) }),
                }),
            });
            mockModel.countDocuments.mockResolvedValue(1);

            const result = await service.findByPatient(patientId);
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
        });
    });

    // â”€â”€â”€ findByAppointment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('findByAppointment', () => {
        it('returns prescription for a given appointment', async () => {
            const rx = makePrescription();
            mockModel.findOne.mockReturnValue({
                populate: () => ({ lean: () => Promise.resolve(rx) }),
            });

            const result = await service.findByAppointment(appointmentId);
            expect(result.success).toBe(true);
            expect(result.data.prescription).toBe(rx);
        });

        it('throws NotFoundException when no prescription found', async () => {
            mockModel.findOne.mockReturnValue({
                populate: () => ({ lean: () => Promise.resolve(null) }),
            });
            await expect(service.findByAppointment('unknown')).rejects.toThrow(NotFoundException);
        });
    });

    // â”€â”€â”€ findOne â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('findOne', () => {
        it('returns a single prescription by id', async () => {
            const rx = makePrescription();
            mockModel.findById.mockReturnValue({
                populate: () => ({ lean: () => Promise.resolve(rx) }),
            });

            const result = await service.findOne(rx._id.toHexString());
            expect(result.success).toBe(true);
        });

        it('throws NotFoundException for invalid id', async () => {
            await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
        });

        it('throws NotFoundException when prescription not found', async () => {
            mockModel.findById.mockReturnValue({
                populate: () => ({ lean: () => Promise.resolve(null) }),
            });
            await expect(service.findOne(new Types.ObjectId().toHexString())).rejects.toThrow(NotFoundException);
        });
    });
});

