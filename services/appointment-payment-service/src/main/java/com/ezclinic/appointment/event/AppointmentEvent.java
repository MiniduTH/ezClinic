package com.ezclinic.appointment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentEvent implements Serializable {
    private String eventType;
    private UUID appointmentId;
    private String patientId;
    private String doctorId;
    private LocalDate appointmentDate;
    private String startTime;
    private String endTime;
    private String type;
    private String status;
    private LocalDateTime timestamp;
}
