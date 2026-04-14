package com.ezclinic.telemedicine.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Symptom Check API Tests")
class SymptomCheckControllerTest extends BaseApiTest {

    private static final String BASE_URL = "/symptom-checks";

    @Test
    @DisplayName("POST /symptom-checks - returns AI suggestion for given symptoms")
    void submitSymptoms_returnsAiSuggestion() throws Exception {
        when(geminiService.analyzeSymptoms(anyString()))
                .thenReturn("{\"recommendation\":\"Rest and drink fluids.\",\"disclaimer\":\"Consult a doctor.\"}");

        mockMvc.perform(post(BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "patientId": "%s",
                                    "symptoms": "I have a headache and fever"
                                }
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.aiSuggestion").exists());
    }

    @Test
    @DisplayName("POST /symptom-checks - returns 400 when symptoms is blank")
    void submitSymptoms_returns400WhenSymptomsBlank() throws Exception {
        mockMvc.perform(post(BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "patientId": "%s",
                                    "symptoms": ""
                                }
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /symptom-checks - returns 400 when patientId is missing")
    void submitSymptoms_returns400WhenPatientIdMissing() throws Exception {
        mockMvc.perform(post(BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "symptoms": "headache" }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /symptom-checks/patient/{id} - returns patient history")
    void getPatientHistory_returnsList() throws Exception {
        UUID patientId = UUID.randomUUID();
        when(geminiService.analyzeSymptoms(anyString())).thenReturn("{\"recommendation\":\"See a doctor.\"}");

        mockMvc.perform(post(BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "patientId": "%s",
                                    "symptoms": "cough and cold"
                                }
                                """.formatted(patientId)))
                .andExpect(status().isOk());

        mockMvc.perform(get(BASE_URL + "/patient/" + patientId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].patientId").value(patientId.toString()));
    }

    @Test
    @DisplayName("GET /symptom-checks/{id} - returns 400 for unknown ID")
    void getSymptomCheck_returns400ForUnknownId() throws Exception {
        mockMvc.perform(get(BASE_URL + "/" + UUID.randomUUID()))
                .andExpect(status().isBadRequest());
    }
}
