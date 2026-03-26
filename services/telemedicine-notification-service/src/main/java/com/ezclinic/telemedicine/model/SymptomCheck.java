package com.ezclinic.telemedicine.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "symptom_checks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SymptomCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String symptoms;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_suggestion", columnDefinition = "jsonb")
    private String aiSuggestion;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
