package com.ezclinic.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateAppointmentRequest {
    @NotNull(message = "Doctor ID is required") private UUID doctorId;
    private UUID slotId;
    @NotNull(message = "Appointment date is required") private LocalDate appointmentDate;
    private String startTime;
    private String endTime;
    @NotBlank(message = "Appointment type is required") private String type;
    private String notes;
}
