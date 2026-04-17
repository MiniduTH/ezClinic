package com.micro.ezclinickaveen.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RescheduleRequestDTO {
    
    @NotNull(message = "New appointment date is required")
    @FutureOrPresent(message = "New appointment date must be today or in the future")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate newAppointmentDate;

    private String newSlotId;
}
