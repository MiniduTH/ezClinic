package com.ezclinic.telemedicine.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ezclinic.telemedicine.dto.NotificationResponse;
import com.ezclinic.telemedicine.dto.SendNotificationRequest;
import com.ezclinic.telemedicine.service.NotificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Email notification management")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/send")
    @Operation(summary = "Send a notification", description = "Directly send an email to a user")
    public ResponseEntity<NotificationResponse> sendNotification(@Valid @RequestBody SendNotificationRequest request) {
        return ResponseEntity.ok(notificationService.processAndSendNotification(request));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user notifications", description = "List all notifications for a specific user")
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(@PathVariable String userId) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @GetMapping("/status/{appointmentId}")
    @Operation(summary = "Get notification status for appointment",
               description = "Returns whether a confirmation email was sent for this appointment")
    public ResponseEntity<Map<String, Object>> getNotificationStatus(@PathVariable String appointmentId) {
        return ResponseEntity.ok(notificationService.getNotificationStatusByAppointment(appointmentId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get notification by ID", description = "Retrieve a specific notification record")
    public ResponseEntity<NotificationResponse> getNotification(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.getNotification(id));
    }
}