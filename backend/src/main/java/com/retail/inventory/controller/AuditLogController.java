package com.retail.inventory.controller;

import com.retail.inventory.dto.AuditLogResponse;
import com.retail.inventory.service.ReportService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

/**
 * ADMIN-only audit log endpoint.
 * Never exposes secrets or internal stack traces — response contains only
 * safe fields: id, eventType, entityName, entityId, performedByUsername, description, timestamp.
 */
@RestController
@RequestMapping("/api/v1/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final ReportService reportService;

    public AuditLogController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * GET /api/v1/audit-logs
     * Paginated audit log with optional filters:
     *   - eventType: exact match (e.g. SALE_COMPLETED, STOCK_ADJUSTMENT)
     *   - startDate / endDate: ISO-8601 instants
     */
    @GetMapping
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            Pageable pageable) {
        Page<AuditLogResponse> logs = reportService.getAuditLogs(eventType, startDate, endDate, pageable);
        return ResponseEntity.ok(logs);
    }
}
