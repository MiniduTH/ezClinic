package com.micro.ezclinickaveen.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
public class RescheduleRequestDTO {
    
    @NotNull(message = "New appointment date is required")
    @FutureOrPresent(message = "New appointment date must be today or in the future")
    private Date newAppointmentDate;

    @NotNull(message = "New slot ID is required")
    private UUID newSlotId;
}
