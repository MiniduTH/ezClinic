package com.ezclinic.telemedicine.listener;

import com.ezclinic.telemedicine.config.RabbitMQConfig;
import com.ezclinic.telemedicine.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Listens to appointment and payment events published by appointment-payment-service
 * and triggers email/SMS notifications to patients and doctors.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentEventListener {

    private final NotificationService notificationService;

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
        String appointmentId = event.get("appointmentId") != null ? event.get("appointmentId").toString() : null;

        log.info("Received payment event: type={}, appointmentId={}", eventType, appointmentId);

        try {
            if ("PAYMENT_COMPLETED".equals(eventType)) {
                notificationService.sendPaymentConfirmationNotification(patientId, appointmentId, event);
            } else {
                log.warn("Unhandled payment event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process payment event {}: {}", eventType, e.getMessage(), e);
        }
    }
}
