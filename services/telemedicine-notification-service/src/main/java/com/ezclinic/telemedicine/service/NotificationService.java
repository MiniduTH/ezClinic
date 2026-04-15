package com.ezclinic.telemedicine.service;

import com.ezclinic.telemedicine.dto.NotificationResponse;
import com.ezclinic.telemedicine.dto.SendNotificationRequest;
import com.ezclinic.telemedicine.enums.NotificationStatus;
import com.ezclinic.telemedicine.enums.NotificationType;
import com.ezclinic.telemedicine.model.Notification;
import com.ezclinic.telemedicine.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    @Transactional
    public NotificationResponse processAndSendNotification(SendNotificationRequest request) {
        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .recipientEmail(request.getRecipientEmail())
                .type(request.getType())
                .subject(request.getSubject())
                .content(request.getContent())
                .status(NotificationStatus.PENDING)
                .build();
        
        notification = notificationRepository.save(notification);

        try {
            if (request.getType() == NotificationType.EMAIL) {
//                emailService.sendEmail(request.getRecipientEmail(), request.getSubject(), request.getContent());
                emailService.sendEmailViaAPI(request.getRecipientEmail(),request.getSubject(), request.getContent());
            }
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(Instant.now());
            log.info("Notification {} sent successfully", notification.getId());
        } catch (Exception e) {
            notification.setStatus(NotificationStatus.FAILED);
            log.error("Failed to send notification {}: {}", notification.getId(), e.getMessage());
        }

        return NotificationResponse.fromEntity(notificationRepository.save(notification));
    }

    public List<NotificationResponse> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public NotificationResponse getNotification(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
        return NotificationResponse.fromEntity(notification);
    }

    // ─── Event-Driven Notification Helpers ──────────────────────────

    public void sendAppointmentBookedNotification(String patientId, String doctorId,
                                                   String appointmentId, java.util.Map<String, Object> event) {
        String date = String.valueOf(event.getOrDefault("appointmentDate", "TBD"));
        String time = String.valueOf(event.getOrDefault("startTime", "TBD"));
        String type = String.valueOf(event.getOrDefault("type", "IN_PERSON"));

        String subject = "Appointment Confirmed — ezClinic";
        String htmlContent = buildAppointmentHtml("Your appointment has been booked", appointmentId, date, time, type,
                "Your appointment is confirmed. Please complete payment to secure your slot.");

        SendNotificationRequest req = SendNotificationRequest.builder()
                .userId(patientId)
                .recipientEmail(patientId + "@placeholder.local") // resolved via patient-service in prod
                .type(com.ezclinic.telemedicine.enums.NotificationType.EMAIL)
                .subject(subject)
                .content(htmlContent)
                .build();
        processAndSendNotification(req);
    }

    public void sendAppointmentCancelledNotification(String patientId, String doctorId,
                                                      String appointmentId, java.util.Map<String, Object> event) {
        String subject = "Appointment Cancelled — ezClinic";
        String htmlContent = buildSimpleHtml("Appointment Cancelled",
                "Your appointment (ID: " + appointmentId + ") has been cancelled.");

        SendNotificationRequest req = SendNotificationRequest.builder()
                .userId(patientId)
                .recipientEmail(patientId + "@placeholder.local")
                .type(com.ezclinic.telemedicine.enums.NotificationType.EMAIL)
                .subject(subject)
                .content(htmlContent)
                .build();
        processAndSendNotification(req);
    }

    public void sendAppointmentStatusNotification(String patientId, String doctorId,
                                                   String appointmentId, String status,
                                                   java.util.Map<String, Object> event) {
        String subject = "Appointment Status Update — ezClinic";
        String htmlContent = buildSimpleHtml("Appointment Update",
                "Your appointment status has been updated to: <strong>" + status + "</strong>");

        SendNotificationRequest req = SendNotificationRequest.builder()
                .userId(patientId)
                .recipientEmail(patientId + "@placeholder.local")
                .type(com.ezclinic.telemedicine.enums.NotificationType.EMAIL)
                .subject(subject)
                .content(htmlContent)
                .build();
        processAndSendNotification(req);
    }

    public void sendPaymentConfirmationNotification(String patientId, String appointmentId,
                                                     java.util.Map<String, Object> event) {
        String amount = String.valueOf(event.getOrDefault("amount", ""));
        String subject = "Payment Confirmed — ezClinic";
        String htmlContent = buildSimpleHtml("Payment Successful",
                "Your payment of LKR <strong>" + amount + "</strong> for appointment <strong>" +
                appointmentId + "</strong> has been received. Your appointment is now confirmed.");

        SendNotificationRequest req = SendNotificationRequest.builder()
                .userId(patientId)
                .recipientEmail(patientId + "@placeholder.local")
                .type(com.ezclinic.telemedicine.enums.NotificationType.EMAIL)
                .subject(subject)
                .content(htmlContent)
                .build();
        processAndSendNotification(req);
    }

    // ─── HTML Template Builders ──────────────────────────────────────

    private String buildAppointmentHtml(String title, String appointmentId,
                                         String date, String time, String type, String message) {
        return "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#f8fafc;padding:24px'>" +
               "<div style='max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 1px 6px rgba(0,0,0,.08)'>" +
               "<h2 style='color:#0EA5E9;margin-top:0'>" + title + "</h2>" +
               "<p style='color:#334155'>" + message + "</p>" +
               "<table style='width:100%;border-collapse:collapse;margin-top:16px'>" +
               "<tr><td style='padding:8px;color:#64748b;width:40%'>Appointment ID</td><td style='padding:8px;font-weight:bold'>" + appointmentId + "</td></tr>" +
               "<tr style='background:#f8fafc'><td style='padding:8px;color:#64748b'>Date</td><td style='padding:8px;font-weight:bold'>" + date + "</td></tr>" +
               "<tr><td style='padding:8px;color:#64748b'>Time</td><td style='padding:8px;font-weight:bold'>" + time + "</td></tr>" +
               "<tr style='background:#f8fafc'><td style='padding:8px;color:#64748b'>Type</td><td style='padding:8px;font-weight:bold'>" + type + "</td></tr>" +
               "</table>" +
               "<p style='color:#94a3b8;font-size:12px;margin-top:24px'>This is an automated message from ezClinic. Do not reply to this email.</p>" +
               "</div></body></html>";
    }

    private String buildSimpleHtml(String title, String message) {
        return "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#f8fafc;padding:24px'>" +
               "<div style='max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 1px 6px rgba(0,0,0,.08)'>" +
               "<h2 style='color:#0EA5E9;margin-top:0'>" + title + "</h2>" +
               "<p style='color:#334155'>" + message + "</p>" +
               "<p style='color:#94a3b8;font-size:12px;margin-top:24px'>This is an automated message from ezClinic. Do not reply to this email.</p>" +
               "</div></body></html>";
    }
}
