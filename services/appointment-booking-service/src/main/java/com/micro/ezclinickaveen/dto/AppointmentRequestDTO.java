package com.micro.ezclinickaveen.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AppointmentRequestDTO {

    @NotNull(message = "Patient ID is required")
    private String patientId;

    @NotNull(message = "Doctor ID is required")
    private String doctorId;

    private String slotId;

    @NotNull(message = "Appointment date is required")
    @FutureOrPresent(message = "Appointment date must be today or in the future")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate appointmentDate;

    @NotBlank(message = "Appointment type is required")
    private String type; // PHYSICAL or VIRTUAL
}
