import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { ConflictException, NotFoundException, BadRequestException } from "@nestjs/common";
import { Types } from "mongoose";
import { DoctorService } from "./doctor.service";
import { Doctor } from "./schemas/doctor.schema";
import { Availability } from "./schemas/availability.schema";
import { AppointmentIntegrationService } from "./integration/appointment.integration.service";
import { PatientIntegrationService } from "./integration/patient.integration.service";

const mockId = new Types.ObjectId().toHexString();

function makeMockDoctor(overrides = {}) {
  return { _id: new Types.ObjectId(mockId), name: "Dr. Test", email: "test@example.com", specialization: "Cardiology", isVerified: false, save: jest.fn().mockResolvedValue(undefined), ...overrides };
}
function makeMockSlot(overrides = {}) {
  return { _id: new Types.ObjectId(), doctorId: new Types.ObjectId(mockId), dayOfWeek: "Monday", startTime: "09:00", endTime: "13:00", isActive: true, maxPatients: 1, consultationType: "both", save: jest.fn().mockResolvedValue(undefined), ...overrides };
}

const mockDoctorModel = { findOne: jest.fn(), findById: jest.fn(), find: jest.fn(), findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn(), countDocuments: jest.fn(), create: jest.fn() };
const mockAvailabilityModel = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), insertMany: jest.fn(), findOneAndDelete: jest.fn(), deleteMany: jest.fn(), countDocuments: jest.fn() };
const mockAppointmentIntegration = { getAppointmentsByDoctor: jest.fn(), updateAppointmentStatus: jest.fn() };
const mockPatientIntegration = { getPatientById: jest.fn(), getPatientReports: jest.fn() };

describe("DoctorService", () => {
  let service: DoctorService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        { provide: getModelToken(Doctor.name), useValue: mockDoctorModel },
        { provide: getModelToken(Availability.name), useValue: mockAvailabilityModel },
        { provide: AppointmentIntegrationService, useValue: mockAppointmentIntegration },
        { provide: PatientIntegrationService, useValue: mockPatientIntegration },
      ],
    }).compile();
    service = module.get<DoctorService>(DoctorService);
  });

  describe("create", () => {
    it("registers a new doctor", async () => {
      mockDoctorModel.findOne.mockResolvedValue(null);
      const doc = makeMockDoctor();
      mockDoctorModel.create.mockResolvedValue(doc);
      const result = await service.create({ name: "Dr. Test", email: "test@example.com" } as any);
      expect(result.success).toBe(true);
      expect(result.data).toBe(doc);
    });
    it("throws ConflictException when email already exists", async () => {
      mockDoctorModel.findOne.mockResolvedValue(makeMockDoctor());
      await expect(service.create({ name: "X", email: "test@example.com" } as any)).rejects.toThrow(ConflictException);
    });
  });

  describe("findOne", () => {
    it("returns a doctor with availability", async () => {
      mockDoctorModel.findById.mockReturnValue({ lean: () => Promise.resolve(makeMockDoctor()) });
      mockAvailabilityModel.find.mockReturnValue({ lean: () => Promise.resolve([]) });
      const result = await service.findOne(mockId);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Dr. Test");
    });
    it("throws NotFoundException for invalid id", async () => {
      await expect(service.findOne("invalid-id")).rejects.toThrow(NotFoundException);
    });
    it("throws NotFoundException when doctor not found", async () => {
      mockDoctorModel.findById.mockReturnValue({ lean: () => Promise.resolve(null) });
      await expect(service.findOne(mockId)).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("updates a doctor profile", async () => {
      mockDoctorModel.findByIdAndUpdate.mockResolvedValue(makeMockDoctor({ specialization: "Neurology" }));
      const result = await service.update(mockId, { specialization: "Neurology" } as any);
      expect(result.success).toBe(true);
    });
    it("throws NotFoundException when doctor not found", async () => {
      mockDoctorModel.findByIdAndUpdate.mockResolvedValue(null);
      await expect(service.update(mockId, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe("verify", () => {
    it("verifies an unverified doctor", async () => {
      const doc = makeMockDoctor({ isVerified: false });
      mockDoctorModel.findById.mockResolvedValue(doc);
      const result = await service.verify(mockId);
      expect(result.success).toBe(true);
      expect(doc.save).toHaveBeenCalled();
    });
    it("throws BadRequestException if already verified", async () => {
      mockDoctorModel.findById.mockResolvedValue(makeMockDoctor({ isVerified: true }));
      await expect(service.verify(mockId)).rejects.toThrow(BadRequestException);
    });
  });

  describe("remove", () => {
    it("deletes a doctor and their availability", async () => {
      mockDoctorModel.findByIdAndDelete.mockResolvedValue(makeMockDoctor());
      mockAvailabilityModel.deleteMany.mockResolvedValue({ deletedCount: 2 });
      await expect(service.remove(mockId)).resolves.toBeUndefined();
      expect(mockAvailabilityModel.deleteMany).toHaveBeenCalled();
    });
    it("throws NotFoundException when doctor not found", async () => {
      mockDoctorModel.findByIdAndDelete.mockResolvedValue(null);
      await expect(service.remove(mockId)).rejects.toThrow(NotFoundException);
    });
  });

  describe("addAvailability", () => {
    const dto = { dayOfWeek: "Monday", startTime: "09:00", endTime: "13:00" };
    beforeEach(() => {
      mockDoctorModel.findById.mockReturnValue({ lean: () => Promise.resolve(makeMockDoctor()) });
      mockAvailabilityModel.find.mockReturnValue({ lean: () => Promise.resolve([]) });
      mockAvailabilityModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
    });
    it("adds a new availability slot", async () => {
      mockAvailabilityModel.create.mockResolvedValue(makeMockSlot());
      const result = await service.addAvailability(mockId, dto as any);
      expect(result.success).toBe(true);
    });
    it("throws ConflictException on overlapping slot", async () => {
      mockAvailabilityModel.findOne.mockReturnValue({ lean: () => Promise.resolve(makeMockSlot()) });
      await expect(service.addAvailability(mockId, dto as any)).rejects.toThrow(ConflictException);
    });
    it("throws BadRequestException when startTime >= endTime", async () => {
      await expect(service.addAvailability(mockId, { ...dto, startTime: "13:00", endTime: "09:00" } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe("toggleAvailability", () => {
    it("toggles slot active state", async () => {
      const slot = makeMockSlot({ isActive: true });
      mockAvailabilityModel.findOne.mockResolvedValue(slot);
      const result = await service.toggleAvailability(mockId, slot._id.toHexString());
      expect(result.success).toBe(true);
      expect(slot.isActive).toBe(false);
    });
    it("throws NotFoundException for unknown slot", async () => {
      mockAvailabilityModel.findOne.mockResolvedValue(null);
      await expect(service.toggleAvailability(mockId, mockId)).rejects.toThrow(NotFoundException);
    });
  });
});
