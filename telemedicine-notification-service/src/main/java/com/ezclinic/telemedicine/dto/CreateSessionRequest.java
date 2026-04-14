package com.ezclinic.telemedicine.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateSessionRequest {

    @NotNull(message = "Appointment ID is required")
    private UUID appointmentId;
}
