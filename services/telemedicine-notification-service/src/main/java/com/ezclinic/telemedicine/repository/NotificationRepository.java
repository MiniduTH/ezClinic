package com.ezclinic.telemedicine.repository;

import com.ezclinic.telemedicine.model.Notification;
import com.ezclinic.telemedicine.enums.NotificationStatus;
import com.ezclinic.telemedicine.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Notification> findTopByAppointmentIdAndTypeAndStatusOrderBySentAtDesc(
            String appointmentId,
            NotificationType type,
            NotificationStatus status
    );
    Optional<Notification> findTopByAppointmentIdAndTypeOrderByCreatedAtDesc(String appointmentId, NotificationType type);
}
