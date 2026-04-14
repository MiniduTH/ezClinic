package com.ezclinic.appointment.event;

import com.ezclinic.appointment.config.RabbitMQConfig;
import com.ezclinic.appointment.model.Appointment;
import com.ezclinic.appointment.model.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishAppointmentBooked(Appointment appointment) {
        AppointmentEvent event = buildAppointmentEvent(appointment, "APPOINTMENT_BOOKED");
        publish(RabbitMQConfig.APPOINTMENT_BOOKED_KEY, event);
        log.info("Published APPOINTMENT_BOOKED event for appointment {}", appointment.getId());
    }

    public void publishAppointmentCancelled(Appointment appointment) {
        AppointmentEvent event = buildAppointmentEvent(appointment, "APPOINTMENT_CANCELLED");
        publish(RabbitMQConfig.APPOINTMENT_CANCELLED_KEY, event);
        log.info("Published APPOINTMENT_CANCELLED event for appointment {}", appointment.getId());
    }

    public void publishAppointmentStatusUpdated(Appointment appointment) {
        AppointmentEvent event = buildAppointmentEvent(appointment, "APPOINTMENT_STATUS_UPDATED");
        publish(RabbitMQConfig.APPOINTMENT_STATUS_UPDATED_KEY, event);
        log.info("Published APPOINTMENT_STATUS_UPDATED event for appointment {}", appointment.getId());
    }

    public void publishPaymentCompleted(Payment payment) {
        PaymentEvent event = PaymentEvent.builder()
                .eventType("PAYMENT_COMPLETED")
                .paymentId(payment.getId())
                .appointmentId(payment.getAppointment().getId())
                .patientId(payment.getAppointment().getPatientId())
                .amount(payment.getAmount())
                .status(payment.getStatus().name())
                .transactionId(payment.getTransactionId())
                .timestamp(LocalDateTime.now())
                .build();
        publish(RabbitMQConfig.PAYMENT_COMPLETED_KEY, event);
        log.info("Published PAYMENT_COMPLETED event for payment {}", payment.getId());
    }

    private AppointmentEvent buildAppointmentEvent(Appointment a, String eventType) {
        return AppointmentEvent.builder()
                .eventType(eventType)
                .appointmentId(a.getId())
                .patientId(a.getPatientId())
                .doctorId(a.getDoctorId())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .type(a.getType().name())
                .status(a.getStatus().name())
                .timestamp(LocalDateTime.now())
                .build();
    }

    private void publish(String routingKey, Object event) {
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, routingKey, event);
    }
}
