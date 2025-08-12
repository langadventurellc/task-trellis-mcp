---
id: T-refactor-pruneclosedtool-to
title: Refactor pruneClosedTool to use TaskTrellisService
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-12T16:51:06.342Z
updated: 2025-08-12T16:51:06.342Z
---

# Refactor pruneClosedTool to Use TaskTrellisService

## Context

The pruneClosedTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.pruneClosed method.

## Implementation Requirements

1. **Update handlePruneClosed function** (`src/tools/pruneClosedTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.pruneClosed(repository, age, scope)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify pruneClosed case to pass service as first parameter

3. **Update tool tests** (`src/tools/__tests__/pruneClosedTool.test.ts`):
   - Mock TaskTrellisService instead of Repository
   - Test only that service.pruneClosed is called with correct parameters
   - Remove detailed pruning logic tests

## Acceptance Criteria

- [ ] handlePruneClosed accepts TaskTrellisService parameter
- [ ] Function delegates to service.pruneClosed with all parameters
- [ ] server.ts integration updated
- [ ] Unit tests verify service calls
- [ ] TypeScript compilation passes
