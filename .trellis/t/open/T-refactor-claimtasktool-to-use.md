---
id: T-refactor-claimtasktool-to-use
title: Refactor claimTaskTool to use TaskTrellisService
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-12T16:50:39.587Z
updated: 2025-08-12T16:50:39.587Z
---

# Refactor claimTaskTool to Use TaskTrellisService

## Context

The claimTaskTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.claimTask method.

## Implementation Requirements

1. **Update handleClaimTask function** (`src/tools/claimTaskTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.claimTask(repository, scope, taskId, force)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify claimTask case to pass service as first parameter

3. **Update tool tests** (`src/tools/__tests__/claimTaskTool.test.ts`):
   - Mock TaskTrellisService instead of Repository
   - Test only that service.claimTask is called with correct parameters
   - Remove detailed claiming logic tests

## Acceptance Criteria

- [ ] handleClaimTask accepts TaskTrellisService parameter
- [ ] Function delegates to service.claimTask with all parameters
- [ ] server.ts integration updated
- [ ] Unit tests verify service calls
- [ ] TypeScript compilation passes
