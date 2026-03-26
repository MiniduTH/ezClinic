package com.ezclinic.appointment.service;

import com.ezclinic.appointment.dto.*;
import com.ezclinic.appointment.enums.AppointmentStatus;
import com.ezclinic.appointment.enums.AppointmentType;
import com.ezclinic.appointment.model.Appointment;
import com.ezclinic.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;

    @Transactional
    public AppointmentResponse createAppointment(UUID patientId, CreateAppointmentRequest request) {
        if (request.getSlotId() != null &&
                appointmentRepository.existsByDoctorIdAndSlotId(request.getDoctorId(), request.getSlotId())) {
            throw new IllegalArgumentException("This time slot is already booked");
        }
        Appointment appointment = Appointment.builder()
                .patientId(patientId).doctorId(request.getDoctorId()).slotId(request.getSlotId())
                .appointmentDate(request.getAppointmentDate()).startTime(request.getStartTime())
                .endTime(request.getEndTime()).type(AppointmentType.valueOf(request.getType()))
                .notes(request.getNotes()).status(AppointmentStatus.PENDING).build();
        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment booked: {} for patient {} with doctor {}", saved.getId(), patientId, request.getDoctorId());
        return AppointmentResponse.fromEntity(saved);
    }

    public Page<AppointmentResponse> getPatientAppointments(UUID patientId, int page, int size) {
        return appointmentRepository.findByPatientId(patientId,
                PageRequest.of(page, size, Sort.by("createdAt").descending())).map(AppointmentResponse::fromEntity);
    }

    public Page<AppointmentResponse> getDoctorAppointments(UUID doctorId, int page, int size) {
        return appointmentRepository.findByDoctorId(doctorId,
                PageRequest.of(page, size, Sort.by("createdAt").descending())).map(AppointmentResponse::fromEntity);
    }

    public AppointmentResponse getAppointment(UUID id) {
        return AppointmentResponse.fromEntity(appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id)));
    }

    @Transactional
    public AppointmentResponse updateAppointment(UUID id, UUID patientId, UpdateAppointmentRequest request) {
        Appointment a = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));
        if (!a.getPatientId().equals(patientId)) throw new SecurityException("You can only modify your own appointments");
        if (a.getStatus() == AppointmentStatus.COMPLETED || a.getStatus() == AppointmentStatus.CANCELLED)
            throw new IllegalStateException("Cannot modify a " + a.getStatus() + " appointment");
        if (request.getSlotId() != null) a.setSlotId(request.getSlotId());
        if (request.getAppointmentDate() != null) a.setAppointmentDate(request.getAppointmentDate());
        if (request.getStartTime() != null) a.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) a.setEndTime(request.getEndTime());
        if (request.getType() != null) a.setType(AppointmentType.valueOf(request.getType()));
        if (request.getNotes() != null) a.setNotes(request.getNotes());
        return AppointmentResponse.fromEntity(appointmentRepository.save(a));
    }

    @Transactional
    public AppointmentResponse cancelAppointment(UUID id, UUID userId) {
        Appointment a = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));
        if (a.getStatus() == AppointmentStatus.COMPLETED || a.getStatus() == AppointmentStatus.CANCELLED)
            throw new IllegalStateException("Appointment is already " + a.getStatus());
        a.setStatus(AppointmentStatus.CANCELLED);
        return AppointmentResponse.fromEntity(appointmentRepository.save(a));
    }

    @Transactional
    public AppointmentResponse updateStatus(UUID id, String status, UUID doctorId) {
        Appointment a = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));
        if (!a.getDoctorId().equals(doctorId)) throw new SecurityException("Only the assigned doctor can update status");
        a.setStatus(AppointmentStatus.valueOf(status));
        return AppointmentResponse.fromEntity(appointmentRepository.save(a));
    }
}
