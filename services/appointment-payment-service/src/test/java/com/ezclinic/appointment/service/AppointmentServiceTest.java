package com.ezclinic.appointment.service;

import com.ezclinic.appointment.dto.CreateAppointmentRequest;
import com.ezclinic.appointment.dto.AppointmentResponse;
import com.ezclinic.appointment.enums.AppointmentStatus;
import com.ezclinic.appointment.enums.AppointmentType;
import com.ezclinic.appointment.model.Appointment;
import com.ezclinic.appointment.repository.AppointmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {
    @Mock private AppointmentRepository appointmentRepository;
    @InjectMocks private AppointmentService appointmentService;

    private UUID patientId, doctorId, appointmentId;
    private Appointment testAppointment;

    @BeforeEach void setUp() {
        patientId = UUID.randomUUID(); doctorId = UUID.randomUUID(); appointmentId = UUID.randomUUID();
        testAppointment = Appointment.builder().id(appointmentId).patientId(patientId).doctorId(doctorId)
                .appointmentDate(LocalDate.now().plusDays(1)).startTime("09:00").endTime("09:30")
                .status(AppointmentStatus.PENDING).type(AppointmentType.IN_PERSON).createdAt(LocalDateTime.now()).build();
    }

    @Test @DisplayName("createAppointment — should book successfully")
    void createAppointment() {
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setDoctorId(doctorId); req.setAppointmentDate(LocalDate.now().plusDays(1)); req.setType("IN_PERSON");
        when(appointmentRepository.save(any())).thenReturn(testAppointment);
        assertNotNull(appointmentService.createAppointment(patientId, req));
        verify(appointmentRepository).save(any());
    }

    @Test @DisplayName("getAppointment — found")
    void getAppointment() {
        when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));
        assertEquals(appointmentId, appointmentService.getAppointment(appointmentId).getId());
    }

    @Test @DisplayName("getAppointment — not found")
    void getAppointmentNotFound() {
        UUID id = UUID.randomUUID();
        when(appointmentRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> appointmentService.getAppointment(id));
    }

    @Test @DisplayName("cancelAppointment — success")
    void cancelAppointment() {
        when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));
        when(appointmentRepository.save(any())).thenReturn(testAppointment);
        appointmentService.cancelAppointment(appointmentId, patientId);
        verify(appointmentRepository).save(any());
    }

    @Test @DisplayName("cancelAppointment — already cancelled")
    void cancelAlreadyCancelled() {
        testAppointment.setStatus(AppointmentStatus.CANCELLED);
        when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));
        assertThrows(IllegalStateException.class, () -> appointmentService.cancelAppointment(appointmentId, patientId));
    }

    @Test @DisplayName("updateStatus — wrong doctor")
    void updateStatusWrongDoctor() {
        when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));
        assertThrows(SecurityException.class, () -> appointmentService.updateStatus(appointmentId, "CONFIRMED", UUID.randomUUID()));
    }
}
