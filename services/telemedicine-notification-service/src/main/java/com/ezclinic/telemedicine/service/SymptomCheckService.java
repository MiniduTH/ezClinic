package com.ezclinic.telemedicine.service;

import com.ezclinic.telemedicine.dto.SymptomCheckRequest;
import com.ezclinic.telemedicine.dto.SymptomCheckResponse;
import com.ezclinic.telemedicine.model.SymptomCheck;
import com.ezclinic.telemedicine.repository.SymptomCheckRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SymptomCheckService {

    private final SymptomCheckRepository repository;
    private final GeminiService geminiService;

    @Transactional
    public SymptomCheckResponse processSymptoms(SymptomCheckRequest request) {
        log.info("Processing symptoms for patient {}", request.getPatientId());
        
        String aiSuggestionJson = geminiService.analyzeSymptoms(request.getSymptoms());

        // We wrap symptoms in a JSON structure if it isn't already, for the JSONB column
        String symptomsJson = "{\"symptoms\":\"" + request.getSymptoms().replace("\"", "\\\"") + "\"}";

        SymptomCheck symptomCheck = SymptomCheck.builder()
                .patientId(request.getPatientId())
                .symptoms(symptomsJson) // Storing properly as stringified JSON
                .aiSuggestion(aiSuggestionJson)
                .build();
        
        SymptomCheck saved = repository.save(symptomCheck);
        return SymptomCheckResponse.fromEntity(saved);
    }

    public List<SymptomCheckResponse> getPatientHistory(UUID patientId) {
        return repository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(SymptomCheckResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public SymptomCheckResponse getSymptomCheck(UUID id) {
        SymptomCheck record = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Record not found: " + id));
        return SymptomCheckResponse.fromEntity(record);
    }
}