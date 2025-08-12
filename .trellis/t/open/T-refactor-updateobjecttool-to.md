---
id: T-refactor-updateobjecttool-to
title: Refactor updateObjectTool to use TaskTrellisService
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-12T16:50:32.852Z
updated: 2025-08-12T16:50:32.852Z
---

# Refactor updateObjectTool to Use TaskTrellisService

## Context

The updateObjectTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.updateObject method.

## Implementation Requirements

1. **Update handleUpdateObject function** (`src/tools/updateObjectTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.updateObject(repository, id, priority, prerequisites, body, status, force)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify updateObject case to pass service as first parameter

3. **Update tool tests** (`src/tools/__tests__/updateObjectTool.test.ts`):
   - Mock TaskTrellisService instead of Repository
   - Test only that service.updateObject is called with correct parameters
   - Remove detailed update logic tests

## Acceptance Criteria

- [ ] handleUpdateObject accepts TaskTrellisService parameter
- [ ] Function delegates to service.updateObject with all parameters
- [ ] server.ts integration updated
- [ ] Unit tests verify service calls
- [ ] TypeScript compilation passes
