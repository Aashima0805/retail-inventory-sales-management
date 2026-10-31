package com.retail.inventory.dto;

import com.retail.inventory.entity.AuditLog;

import java.time.Instant;

public class AuditLogResponse {

    private Long id;
    private String eventType;
    private String entityName;
    private Long entityId;
    private String performedByUsername;
    private String description;
    private Instant timestamp;

    public AuditLogResponse() {
    }

    public AuditLogResponse(Long id, String eventType, String entityName, Long entityId,
                            String performedByUsername, String description, Instant timestamp) {
        this.id = id;
        this.eventType = eventType;
        this.entityName = entityName;
        this.entityId = entityId;
        this.performedByUsername = performedByUsername;
        this.description = description;
        this.timestamp = timestamp;
    }

    public static AuditLogResponse fromEntity(AuditLog log) {
        if (log == null) {
            return null;
        }
        return new AuditLogResponse(
                log.getId(),
                log.getEventType(),
                log.getEntityName(),
                log.getEntityId(),
                log.getPerformedBy() != null ? log.getPerformedBy().getUsername() : null,
                log.getDetails(),
                log.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getEntityName() {
        return entityName;
    }

    public void setEntityName(String entityName) {
        this.entityName = entityName;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getPerformedByUsername() {
        return performedByUsername;
    }

    public void setPerformedByUsername(String performedByUsername) {
        this.performedByUsername = performedByUsername;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
