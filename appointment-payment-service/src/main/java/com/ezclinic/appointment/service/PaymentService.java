package com.ezclinic.appointment.service;

import com.ezclinic.appointment.dto.PayHereHashResponse;
import com.ezclinic.appointment.dto.PaymentResponse;
import com.ezclinic.appointment.enums.AppointmentStatus;
import com.ezclinic.appointment.enums.PaymentStatus;
import com.ezclinic.appointment.event.EventPublisher;
import com.ezclinic.appointment.model.Appointment;
import com.ezclinic.appointment.model.Payment;
import com.ezclinic.appointment.repository.AppointmentRepository;
import com.ezclinic.appointment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final EventPublisher eventPublisher;

    @Value("${payhere.merchant-id}") private String merchantId;
    @Value("${payhere.merchant-secret}") private String merchantSecret;

    @Transactional
    public PayHereHashResponse generatePayHereHash(UUID appointmentId, BigDecimal amount) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + appointmentId));
        if (appointment.getStatus() == AppointmentStatus.CANCELLED)
            throw new IllegalStateException("Cannot pay for a cancelled appointment");
        if (paymentRepository.findByAppointmentId(appointmentId).isPresent())
            throw new IllegalStateException("Payment already exists for this appointment");

        // Format amount accurately to two decimal places
        DecimalFormat df = new DecimalFormat("0.00");
        String formattedAmount = df.format(amount);
        String currency = "LKR";

        try {
            // Hash = uppercase(md5(merchant_id + order_id + amount + currency + uppercase(md5(merchant_secret))))
            MessageDigest md = MessageDigest.getInstance("MD5");
            String hashedSecret = bytesToHex(md.digest(merchantSecret.getBytes())).toUpperCase();
            String hashString = merchantId + appointmentId.toString() + formattedAmount + currency + hashedSecret;
            String finalHash = bytesToHex(md.digest(hashString.getBytes())).toUpperCase();

            paymentRepository.save(Payment.builder()
                    .appointment(appointment)
                    .amount(amount)
                    .status(PaymentStatus.PENDING)
                    .build());

            return PayHereHashResponse.builder()
                    .merchantId(merchantId)
                    .orderId(appointmentId.toString())
                    .amount(formattedAmount)
                    .currency(currency)
                    .hash(finalHash)
                    .build();

        } catch (Exception e) {
            log.error("Failed to generate PayHere Hash", e);
            throw new RuntimeException("Payment processing failed internally");
        }
    }

    @Transactional
    public void handlePayHereNotify(Map<String, String> payload) {
        String md5sig = payload.get("md5sig");
        String status = payload.get("status_code");
        String orderId = payload.get("order_id");
        String payhereAmount = payload.get("payhere_amount");
        String payhereCurrency = payload.get("payhere_currency");
        String paymentId = payload.get("payment_id");

        try {
            // Webhook Hash = uppercase(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + uppercase(md5(merchant_secret))))
            MessageDigest md = MessageDigest.getInstance("MD5");
            String hashedSecret = bytesToHex(md.digest(merchantSecret.getBytes())).toUpperCase();
            String hashString = merchantId + orderId + payhereAmount + payhereCurrency + status + hashedSecret;
            String generatedSig = bytesToHex(md.digest(hashString.getBytes())).toUpperCase();

            if (!generatedSig.equals(md5sig)) {
                throw new SecurityException("PayHere signature verification failed");
            }

            Payment payment = paymentRepository.findByAppointmentId(UUID.fromString(orderId))
                    .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

            if ("2".equals(status)) { // 2 = Success in PayHere
                payment.setStatus(PaymentStatus.PAID);
                payment.setGatewayReferenceId(paymentId);
                payment.setTransactionId(paymentId);
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
                
                Appointment a = payment.getAppointment();
                a.setStatus(AppointmentStatus.CONFIRMED);
                appointmentRepository.save(a);
                
                log.info("PayHere payment completed for appointment {}", a.getId());
                eventPublisher.publishPaymentCompleted(payment);
            } else if ("-1".equals(status) || "-2".equals(status)) {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
            }

        } catch (Exception e) {
            log.error("Webhook processing failed", e);
            throw new RuntimeException("Failed to process webhook");
        }
    }

    public PaymentResponse getPaymentByAppointment(UUID appointmentId) {
        return PaymentResponse.fromEntity(paymentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("No payment found for appointment: " + appointmentId)));
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
