package com.ezclinic.telemedicine.controller;

import com.ezclinic.telemedicine.dto.NotificationResponse;
import com.ezclinic.telemedicine.dto.SendNotificationRequest;
import com.ezclinic.telemedicine.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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

    @GetMapping("/{id}")
    @Operation(summary = "Get notification by ID", description = "Retrieve a specific notification record")
    public ResponseEntity<NotificationResponse> getNotification(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.getNotification(id));
    }
}