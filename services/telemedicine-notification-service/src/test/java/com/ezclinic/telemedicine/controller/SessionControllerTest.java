package com.ezclinic.telemedicine.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Session API Tests")
class SessionControllerTest extends BaseApiTest {

    private static final String BASE_URL = "/sessions";

    @Test
    @DisplayName("POST /sessions - creates a session and returns Jitsi URL")
    void createSession_returnsCreatedSession() throws Exception {
        String appointmentId = UUID.randomUUID().toString();

        mockMvc.perform(post(BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "appointmentId": "%s" }
                                """.formatted(appointmentId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.roomId").value("ezclinic-" + appointmentId))
                .andExpect(jsonPath("$.jitsiUrl").value("https://meet.jit.si/ezclinic-" + appointmentId));
    }

    @Test
    @DisplayName("POST /sessions - returns 400 when appointmentId is missing")
    void createSession_returns400WhenMissingAppointmentId() throws Exception {
        mockMvc.perform(post(BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /sessions - returns 400 for duplicate appointment")
    void createSession_returns400ForDuplicate() throws Exception {
        String appointmentId = UUID.randomUUID().toString();
        String body = """
                { "appointmentId": "%s" }
                """.formatted(appointmentId);

        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /sessions/{id} - returns 400 for unknown session ID")
    void getSession_returns400ForUnknownId() throws Exception {
        mockMvc.perform(get(BASE_URL + "/" + UUID.randomUUID()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /sessions - returns an array")
    void getAllSessions_returnsArray() throws Exception {
        mockMvc.perform(get(BASE_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("PATCH /sessions/{id}/end - ends a session")
    void endSession_setsEndedAt() throws Exception {
        String appointmentId = UUID.randomUUID().toString();

        String response = mockMvc.perform(post(BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "appointmentId": "%s" }
                                """.formatted(appointmentId)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String sessionId = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(response).get("id").asText();

        mockMvc.perform(patch(BASE_URL + "/" + sessionId + "/end"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endedAt").exists());
    }
}
