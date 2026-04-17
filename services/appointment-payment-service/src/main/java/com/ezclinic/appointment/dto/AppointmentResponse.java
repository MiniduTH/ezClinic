package com.ezclinic.appointment.dto;

import com.ezclinic.appointment.model.Appointment;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AppointmentResponse {
    private UUID id;
    private String patientId;
    private String doctorId;
    private String slotId;
    private LocalDate appointmentDate;
    private String startTime;
    private String endTime;
    private String status;
    private String type;
    private String notes;
    private LocalDateTime createdAt;
    private PaymentResponse payment;

    public static AppointmentResponse fromEntity(Appointment a) {
        AppointmentResponse r = AppointmentResponse.builder()
                .id(a.getId()).patientId(a.getPatientId()).doctorId(a.getDoctorId())
                .slotId(a.getSlotId()).appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime()).endTime(a.getEndTime())
                .status(a.getStatus().name()).type(a.getType().name())
                .notes(a.getNotes()).createdAt(a.getCreatedAt()).build();
        if (a.getPayment() != null) r.setPayment(PaymentResponse.fromEntity(a.getPayment()));
        return r;
    }
}
