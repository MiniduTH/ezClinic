package com.micro.ezclinickaveen.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class RescheduleRequestDTO {
    
    @NotNull(message = "New appointment date is required")
    @FutureOrPresent(message = "New appointment date must be today or in the future")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate newAppointmentDate;

    @NotNull(message = "New slot ID is required")
    private UUID newSlotId;
}
