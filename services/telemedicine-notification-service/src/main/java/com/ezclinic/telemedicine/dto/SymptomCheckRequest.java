package com.ezclinic.telemedicine.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SymptomCheckRequest {

    @NotBlank(message = "Patient ID is required")
    private String patientId;

    @NotBlank(message = "Symptoms description is required")
    private String symptoms;
}
