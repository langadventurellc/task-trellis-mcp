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

The completeTaskTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.completeTask method and migrate business logic tests to service tests.

## Implementation Requirements

1. **Update handleCompleteTask function** (`src/tools/completeTaskTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.completeTask(repository, taskId, summary, filesChanged)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify completeTask case to pass service as first parameter

3. **Migrate and update tests**:
   - **Move business logic tests**: Extract detailed completion logic tests from `src/tools/__tests__/completeTaskTool.test.ts` and move them to `src/services/local/__tests__/LocalTaskTrellisService.test.ts`
   - **Update tool tests**: Refactor `src/tools/__tests__/completeTaskTool.test.ts` to:
     - Mock TaskTrellisService instead of Repository
     - Test only that service.completeTask is called with correct parameters
     - Keep argument parsing and validation tests
   - **Add service tests**: Ensure `LocalTaskTrellisService.completeTask` has comprehensive test coverage including error handling, task completion logic, and file tracking

## Acceptance Criteria

- [ ] handleCompleteTask accepts TaskTrellisService parameter
- [ ] Function delegates to service.completeTask with all parameters
- [ ] server.ts integration updated
- [ ] Business logic tests moved from tool tests to service tests
- [ ] Tool tests updated to mock service and verify integration only
- [ ] Service tests cover all completion logic scenarios
- [ ] TypeScript compilation passes
