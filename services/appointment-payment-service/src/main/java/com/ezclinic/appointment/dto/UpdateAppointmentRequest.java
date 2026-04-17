package com.ezclinic.appointment.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateAppointmentRequest {
    private String slotId;
    private LocalDate appointmentDate;
    private String startTime;
    private String endTime;
    private String type;
    private String notes;
}
