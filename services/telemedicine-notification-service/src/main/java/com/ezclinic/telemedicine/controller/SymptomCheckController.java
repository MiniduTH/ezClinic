package com.ezclinic.telemedicine.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ezclinic.telemedicine.dto.SymptomCheckRequest;
import com.ezclinic.telemedicine.dto.SymptomCheckResponse;
import com.ezclinic.telemedicine.service.SymptomCheckService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/symptom-checks")
@RequiredArgsConstructor
@Tag(name = "AI Symptom Checker", description = "Get preliminary health suggestions using Google Gemini")
public class SymptomCheckController {

    private final SymptomCheckService symptomCheckService;

    @PostMapping
    @Operation(summary = "Submit symptoms", description = "Send patient symptoms to Gemini AI and get a recommendation")
    public ResponseEntity<SymptomCheckResponse> submitSymptoms(@Valid @RequestBody SymptomCheckRequest request) {
        return ResponseEntity.ok(symptomCheckService.processSymptoms(request));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get patient symptom checks", description = "Retrieve a history of a patient's symptom checks")
    public ResponseEntity<List<SymptomCheckResponse>> getPatientHistory(@PathVariable String patientId) {
        return ResponseEntity.ok(symptomCheckService.getPatientHistory(patientId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get symptom check by ID", description = "Retrieve a specific symptom check record")
    public ResponseEntity<SymptomCheckResponse> getSymptomCheck(@PathVariable UUID id) {
        return ResponseEntity.ok(symptomCheckService.getSymptomCheck(id));
    }
}
