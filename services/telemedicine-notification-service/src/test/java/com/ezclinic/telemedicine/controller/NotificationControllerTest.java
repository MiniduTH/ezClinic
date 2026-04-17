package com.ezclinic.telemedicine.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Notification API Tests")
class NotificationControllerTest extends BaseApiTest {

    private static final String BASE_URL = "/notifications";

    @Test
    @DisplayName("POST /notifications/send - sends email and returns SENT status")
    void sendNotification_returnsSentStatus() throws Exception {
        mockMvc.perform(post(BASE_URL + "/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "userId": "%s",
                                    "recipientEmail": "patient@example.com",
                                    "type": "EMAIL",
                                    "subject": "Appointment Reminder",
                                    "content": "Your appointment is confirmed."
                                }
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.status").value("SENT"))
                .andExpect(jsonPath("$.recipientEmail").value("test-recipient@example.com"));
    }

    @Test
    @DisplayName("POST /notifications/send - returns 400 for invalid email")
    void sendNotification_returns400ForInvalidEmail() throws Exception {
        mockMvc.perform(post(BASE_URL + "/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "userId": "%s",
                                    "recipientEmail": "not-an-email",
                                    "type": "EMAIL",
                                    "subject": "Test",
                                    "content": "Hello"
                                }
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /notifications/send - returns 400 when body is empty")
    void sendNotification_returns400WhenEmpty() throws Exception {
        mockMvc.perform(post(BASE_URL + "/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /notifications/user/{userId} - returns list for a user")
    void getUserNotifications_returnsList() throws Exception {
        UUID userId = UUID.randomUUID();

        mockMvc.perform(post(BASE_URL + "/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "userId": "%s",
                                    "recipientEmail": "user@example.com",
                                    "type": "EMAIL",
                                    "subject": "Hello",
                                    "content": "Test"
                                }
                                """.formatted(userId)))
                .andExpect(status().isOk());

        mockMvc.perform(get(BASE_URL + "/user/" + userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].userId").value(userId.toString()));
    }

    @Test
    @DisplayName("GET /notifications/{id} - returns 400 for unknown ID")
    void getNotification_returns400ForUnknownId() throws Exception {
        mockMvc.perform(get(BASE_URL + "/" + UUID.randomUUID()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /notifications/status/{appointmentId} - returns sent=true after send")
    void getAppointmentNotificationStatus_returnsSentStatus() throws Exception {
        String appointmentId = UUID.randomUUID().toString();
        String userId = UUID.randomUUID().toString();

        mockMvc.perform(post(BASE_URL + "/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "appointmentId": "%s",
                                    "userId": "%s",
                                    "recipientEmail": "patient@example.com",
                                    "type": "EMAIL",
                                    "subject": "Appointment Reminder",
                                    "content": "Your appointment is confirmed."
                                }
                                """.formatted(appointmentId, userId)))
                .andExpect(status().isOk());

        mockMvc.perform(get(BASE_URL + "/status/" + appointmentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentId").value(appointmentId))
                .andExpect(jsonPath("$.emailSent").value(true))
                .andExpect(jsonPath("$.emailSentAt").exists());
    }

    @Test
    @DisplayName("GET /notifications/status/{appointmentId} - returns sent=false when no notification exists")
    void getAppointmentNotificationStatus_returnsNotSentWhenMissing() throws Exception {
        String appointmentId = UUID.randomUUID().toString();

        mockMvc.perform(get(BASE_URL + "/status/" + appointmentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentId").value(appointmentId))
                .andExpect(jsonPath("$.emailSent").value(false))
                .andExpect(jsonPath("$.emailSentAt").isEmpty());
    }
}
