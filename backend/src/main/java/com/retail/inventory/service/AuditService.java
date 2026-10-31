package com.retail.inventory.service;

import com.retail.inventory.entity.AuditLog;
import com.retail.inventory.entity.User;
import com.retail.inventory.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public AuditLog logEvent(String eventType, String entityName, Long entityId, User performedBy, String details) {
        AuditLog log = new AuditLog();
        log.setEventType(eventType);
        log.setEntityName(entityName);
        log.setEntityId(entityId);
        log.setPerformedBy(performedBy);
        log.setDetails(details);
        log.setCreatedAt(Instant.now());

        AuditLog saved = auditLogRepository.save(log);
        logger.info("Audit logged: eventType='{}', entity='{}:{}', user='{}'",
                eventType, entityName, entityId, performedBy != null ? performedBy.getUsername() : "SYSTEM");
        return saved;
    }
}
