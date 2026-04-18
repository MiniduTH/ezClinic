package com.ezclinic.telemedicine.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ezclinic.telemedicine.model.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<Notification> findFirstByContentContainingOrderByCreatedAtDesc(String fragment);
}
