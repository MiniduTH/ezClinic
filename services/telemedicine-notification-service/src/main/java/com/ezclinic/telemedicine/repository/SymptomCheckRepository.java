package com.ezclinic.telemedicine.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ezclinic.telemedicine.model.SymptomCheck;

@Repository
public interface SymptomCheckRepository extends JpaRepository<SymptomCheck, UUID> {
    List<SymptomCheck> findByPatientIdOrderByCreatedAtDesc(String patientId);
}
