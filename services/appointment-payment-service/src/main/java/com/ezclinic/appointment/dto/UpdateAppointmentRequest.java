package com.ezclinic.appointment.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class UpdateAppointmentRequest {
    private UUID slotId;
    private LocalDate appointmentDate;
    private String startTime;
    private String endTime;
    private String type;
    private String notes;
}
