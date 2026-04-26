package com.micro.ezclinickaveen.service;

import com.micro.ezclinickaveen.config.PayHereConfig;
import com.micro.ezclinickaveen.dto.PayHereDTO;
import com.micro.ezclinickaveen.dto.PaymentSuccessEvent;
import com.micro.ezclinickaveen.exception.ResourceNotFoundException;
import com.micro.ezclinickaveen.model.Appointment;
import com.micro.ezclinickaveen.model.Payment;
import com.micro.ezclinickaveen.repository.AppointmentRepository;
import com.micro.ezclinickaveen.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentWebhookService {

    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final PayHereConfig payHereConfig;
    private final NotificationEventProducer notificationEventProducer;

    public PayHereDTO getCheckoutParams(UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        
        Payment payment = appointment.getPayment();
        if (payment == null) {
            throw new ResourceNotFoundException("Payment record not found for appointment");
        }

        double amount = payment.getAmount().doubleValue();
        String currency = "LKR";
        String hash = payHereConfig.generateHash(appointmentId.toString(), amount, currency);

        return PayHereDTO.builder()
                .merchant_id(payHereConfig.getMerchantId())
                .return_url(payHereConfig.getReturnUrl())
                .cancel_url(payHereConfig.getCancelUrl())
                .notify_url(payHereConfig.getNotifyUrl())
                .first_name("Patient")
                .last_name("")
                .email("patient@example.com")
                .phone("0770000000")
                .address("Colombo")
                .city("Colombo")
                .country("Sri Lanka")
                .order_id(appointmentId.toString())
                .items("Medical Consultation - " + appointment.getType())
                .currency(currency)
                .amount(amount)
                .hash(hash)
                .build();
    }

    public void processPayHereNotification(Map<String, String> payload) {
        log.info("Received PayHere Notification: {}", payload);

        String merchantId = payload.get("merchant_id");
        String orderId = payload.get("order_id");
        String payhereAmount = payload.get("payhere_amount");
        String payhereCurrency = payload.get("payhere_currency");
        String statusCode = payload.get("status_code");
        String md5sig = payload.get("md5sig");
        String paymentId = payload.get("payment_id");

        // Verify Hash
        String generatedHash = payHereConfig.generateNotificationHash(orderId, Double.parseDouble(payhereAmount), payhereCurrency, statusCode);

        if (!generatedHash.equals(md5sig)) {
            log.warn("Invalid PayHere hash! Expected: {}, got: {}", generatedHash, md5sig);
            throw new SecurityException("Invalid hash signature. Verification failed.");
        }

        if ("2".equals(statusCode)) {
            log.info("Payment SUCCESS verified for Order: {}", orderId);
            UUID apptId = UUID.fromString(orderId);
            
            Payment payment = paymentRepository.findByAppointmentId(apptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order"));
            
            payment.setStatus("SUCCESS");
            payment.setTransactionId(paymentId);
            paymentRepository.save(payment);

            Appointment appointment = payment.getAppointment();
            appointment.setStatus("CONFIRMED");
            appointmentRepository.save(appointment);

            // Trigger RabbitMQ Notification
            PaymentSuccessEvent event = PaymentSuccessEvent.builder()
                    .appointmentId(appointment.getId())
                    .patientId(appointment.getPatientId())
                    .doctorId(appointment.getDoctorId())
                    .appointmentDate(appointment.getAppointmentDate())
                    .amountPaid(new BigDecimal(payhereAmount))
                    .receiptNo(paymentId)
                    .build();
            
            notificationEventProducer.sendPaymentSuccessNotification(event);

        } else {
            log.warn("Payment failed or pending for Order: {}, status_code: {}", orderId, statusCode);
        }
    }
}
