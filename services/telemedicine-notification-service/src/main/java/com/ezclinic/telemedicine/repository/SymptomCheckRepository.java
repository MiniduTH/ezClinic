package com.ezclinic.telemedicine.repository;

import com.ezclinic.telemedicine.model.SymptomCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SymptomCheckRepository extends JpaRepository<SymptomCheck, UUID> {
    List<SymptomCheck> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
}
