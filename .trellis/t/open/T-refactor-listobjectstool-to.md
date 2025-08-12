---
id: T-refactor-listobjectstool-to
title: Refactor listObjectsTool to use TaskTrellisService
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-12T16:49:18.835Z
updated: 2025-08-12T16:49:18.835Z
---

# Refactor listObjectsTool to Use TaskTrellisService

## Context

The listObjectsTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.listObjects method.

## Implementation Requirements

1. **Update handleListObjects function** (`src/tools/listObjectsTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.listObjects(repository, type, scope, status, priority, includeClosed)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify listObjects case to pass service as first parameter

3. **Update tool tests** (`src/tools/__tests__/listObjectsTool.test.ts`):
   - Mock TaskTrellisService instead of Repository
   - Test only that service.listObjects is called with correct parameters
   - Remove detailed filtering and listing logic tests

## Acceptance Criteria

- [ ] handleListObjects accepts TaskTrellisService parameter
- [ ] Function delegates to service.listObjects with all filter parameters
- [ ] server.ts integration updated
- [ ] Unit tests verify service calls
- [ ] TypeScript compilation passes
