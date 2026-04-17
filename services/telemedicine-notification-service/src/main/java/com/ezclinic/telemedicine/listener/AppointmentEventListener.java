package com.ezclinic.telemedicine.listener;

import com.ezclinic.telemedicine.config.RabbitMQConfig;
import com.ezclinic.telemedicine.dto.CreateSessionRequest;
import com.ezclinic.telemedicine.service.NotificationService;
import com.ezclinic.telemedicine.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentEventListener {

    private final NotificationService notificationService;
    private final SessionService sessionService;

    @RabbitListener(queues = RabbitMQConfig.APPOINTMENT_EVENTS_QUEUE)
    public void handleAppointmentEvent(Map<String, Object> event) {
        String eventType = (String) event.getOrDefault("eventType", "UNKNOWN");
        String patientId = (String) event.get("patientId");
        String doctorId  = (String) event.get("doctorId");
        String appointmentId = event.get("appointmentId") != null ? event.get("appointmentId").toString() : null;

        log.info("Received appointment event: type={}, appointmentId={}", eventType, appointmentId);

        try {
            switch (eventType) {
                case "APPOINTMENT_BOOKED" -> notificationService.sendAppointmentBookedNotification(
                        patientId, doctorId, appointmentId, event);
                case "APPOINTMENT_CANCELLED" -> notificationService.sendAppointmentCancelledNotification(
                        patientId, doctorId, appointmentId, event);
                case "APPOINTMENT_STATUS_UPDATED" -> notificationService.sendAppointmentStatusNotification(
                        patientId, doctorId, appointmentId,
                        (String) event.getOrDefault("status", "UPDATED"), event);
                default -> log.warn("Unhandled appointment event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process appointment event {}: {}", eventType, e.getMessage(), e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.PAYMENT_EVENTS_QUEUE)
    public void handlePaymentEvent(Map<String, Object> event) {
        String eventType = (String) event.getOrDefault("eventType", "UNKNOWN");
        String patientId = (String) event.get("patientId");
        String doctorId  = (String) event.get("doctorId");
        String appointmentId = event.get("appointmentId") != null ? event.get("appointmentId").toString() : null;

        log.info("Received payment event: type={}, appointmentId={}", eventType, appointmentId);

        try {
            if ("PAYMENT_COMPLETED".equals(eventType)) {
                autoCreateJitsiSession(appointmentId);
                notificationService.sendPaymentConfirmationNotification(patientId, appointmentId, event);
                if (doctorId != null) {
                    notificationService.sendDoctorSessionReadyNotification(doctorId, appointmentId, event);
                }
            } else {
                log.warn("Unhandled payment event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process payment event {}: {}", eventType, e.getMessage(), e);
        }
    }

    private void autoCreateJitsiSession(String appointmentId) {
        if (appointmentId == null) return;
        try {
            CreateSessionRequest req = new CreateSessionRequest();
            req.setAppointmentId(UUID.fromString(appointmentId));
            sessionService.createSession(req);
            log.info("Auto-created Jitsi session for appointment {}", appointmentId);
        } catch (IllegalArgumentException e) {
            // Session already exists for this appointment — idempotent, not an error
            log.info("Jitsi session already exists for appointment {}", appointmentId);
        } catch (Exception e) {
            log.error("Failed to auto-create Jitsi session for appointment {}: {}", appointmentId, e.getMessage(), e);
        }
    }
}
