package com.ezclinic.appointment.repository;

import com.ezclinic.appointment.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByAppointmentId(UUID appointmentId);
    Optional<Payment> findByGatewayReferenceId(String gatewayReferenceId);
}
