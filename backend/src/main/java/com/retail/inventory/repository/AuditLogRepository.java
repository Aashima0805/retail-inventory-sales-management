package com.retail.inventory.repository;

import com.retail.inventory.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByEventType(String eventType, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:eventType IS NULL OR a.eventType = :eventType) AND " +
           "(:start IS NULL OR a.createdAt >= :start) AND " +
           "(:end IS NULL OR a.createdAt <= :end) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findByFilters(
            @Param("eventType") String eventType,
            @Param("start") Instant start,
            @Param("end") Instant end,
            Pageable pageable);
}
