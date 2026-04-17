package com.ezclinic.telemedicine.dto;

import com.ezclinic.telemedicine.model.SymptomCheck;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data @Builder
public class SymptomCheckResponse {

    private UUID id;
    private String patientId;
    private String symptoms;
    private String aiSuggestion;
    private Instant createdAt;

    public static SymptomCheckResponse fromEntity(SymptomCheck symptomCheck) {
        return SymptomCheckResponse.builder()
                .id(symptomCheck.getId())
                .patientId(symptomCheck.getPatientId())
                .symptoms(symptomCheck.getSymptoms())
                .aiSuggestion(symptomCheck.getAiSuggestion())
                .createdAt(symptomCheck.getCreatedAt())
                .build();
    }
}
