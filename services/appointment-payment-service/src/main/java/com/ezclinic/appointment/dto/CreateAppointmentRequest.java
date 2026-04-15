package com.ezclinic.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CreateAppointmentRequest {
    @NotBlank(message = "Doctor ID is required") private String doctorId;
    private String slotId;
    @NotNull(message = "Appointment date is required") private LocalDate appointmentDate;
    private String startTime;
    private String endTime;
    @NotBlank(message = "Appointment type is required") private String type;
    private String notes;
}
