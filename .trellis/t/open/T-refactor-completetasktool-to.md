---
id: T-refactor-completetasktool-to
title: Refactor completeTaskTool to use TaskTrellisService
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-12T16:50:45.881Z
updated: 2025-08-12T16:50:45.881Z
---

# Refactor completeTaskTool to Use TaskTrellisService

## Context

The completeTaskTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.completeTask method.

## Implementation Requirements

1. **Update handleCompleteTask function** (`src/tools/completeTaskTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.completeTask(repository, taskId, summary, filesChanged)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify completeTask case to pass service as first parameter

3. **Update tool tests** (`src/tools/__tests__/completeTaskTool.test.ts`):
   - Mock TaskTrellisService instead of Repository
   - Test only that service.completeTask is called with correct parameters
   - Remove detailed completion logic tests

## Acceptance Criteria

- [ ] handleCompleteTask accepts TaskTrellisService parameter
- [ ] Function delegates to service.completeTask with all parameters
- [ ] server.ts integration updated
- [ ] Unit tests verify service calls
- [ ] TypeScript compilation passes
