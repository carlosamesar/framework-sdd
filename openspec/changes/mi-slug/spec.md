# Spec: inventory-adjustment-audit-integration

## Context
El route `/inventory/adjustments/new` integra con el servicio `transacciones-unificadas`. Se requiere auditar la consistencia de datos y el aislamiento tenant entre ambos servicios para validar su nivel funcional.

---

## REQ-01: Validate Integration Consistency

**MUST** verify that every inventory adjustment record has a corresponding entry in `transacciones-unificadas`.
**MUST NOT** mark the integration as healthy if correlation IDs are missing.
**MAY** include latency metrics between adjustment creation and transaction logging.

### Scenario 1.1 — Successful correlation check
```
Given: An inventory adjustment exists with a valid `transaction-ref-id`
When: The audit service queries `transacciones-unificadas` using the ref
Then: Return status 200 with match confirmation and timestamp delta
```

### Scenario 1.2 — Missing transaction record
```
Given: An inventory adjustment exists without a linked transaction log
Then: Return status 409 and error message "integration-mismatch-detected"
```

---

## REQ-02: Enforce Tenant Security Context

**MUST** extract `tenant-id` exclusively from JWT claim `custom:tenant_id`.
**MUST NOT** accept `tenant-id` from request body, query params, or headers.
**MAY** log security violations for further analysis.

### Scenario 2.1 — Valid tenant context
```
Given: A valid JWT with `custom:tenant_id` matching the resource owner
When: The audit request is processed
Then: Access is granted and audit proceeds normally
```

### Scenario 2.2 — Tenant isolation violation
```
Given: A JWT with `custom:tenant_id` differing from the resource owner
Then: Return status 403 and error message "tenant-isolation-violation"
```

---

## REQ-03: Generate Functional Level Report

**MUST** produce a summary report indicating the integration health status.
**MUST NOT** expose internal service endpoints or stack traces in the report.
**MAY** categorize status as 'healthy', 'degraded', or 'critical'.

### Scenario 3.1 — Healthy integration report
```
Given: All consistency checks pass within latency thresholds
When: The audit completes successfully
Then: Return status 200 with body `{ "status": "healthy", "score": 100 }`
```

### Scenario 3.2 — Degraded integration report
```
Given: Consistency checks pass but latency exceeds 500ms threshold
When: The audit completes with warnings
Then: Return status 200 with body `{ "status": "degraded", "score": 75 }`
```

---

## Non-functional requirements

- **Seguridad**: tenantId siempre desde JWT custom:tenant_id, nunca desde input del cliente.
- **Performance**: El proceso de auditoría no debe exceder 2 segundos de latencia total por lote.
