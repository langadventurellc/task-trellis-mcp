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

The claimTaskTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.claimTask method and migrate business logic tests to service tests.

## Implementation Requirements

1. **Update handleClaimTask function** (`src/tools/claimTaskTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.claimTask(repository, scope, taskId, force)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify claimTask case to pass service as first parameter

3. **Migrate and update tests**:
   - **Move business logic tests**: Extract detailed claiming logic tests from `src/tools/__tests__/claimTaskTool.test.ts` and move them to `src/services/local/__tests__/LocalTaskTrellisService.test.ts`
   - **Create dedicated service function tests**: Create `src/services/local/__tests__/claimTask.test.ts` with comprehensive test coverage for the `claimTask` function, including:
     - Normal task claiming scenarios
     - Scope filtering
     - Force claiming
     - Error handling (object not found, validation errors, etc.)
     - Task readiness validation
     - Priority-based selection
     - All edge cases and business logic
   - **Update tool tests**: Refactor `src/tools/__tests__/claimTaskTool.test.ts` to:
     - Mock TaskTrellisService instead of Repository
     - Test only that service.claimTask is called with correct parameters
     - Keep argument parsing and validation tests
   - **Add service tests**: Ensure `LocalTaskTrellisService.claimTask` has comprehensive test coverage including error handling, task claiming logic, and prerequisites

## Acceptance Criteria

- [ ] handleClaimTask accepts TaskTrellisService parameter
- [ ] Function delegates to service.claimTask with all parameters
- [ ] server.ts integration updated
- [ ] Business logic tests moved from tool tests to service tests
- [ ] Dedicated `src/services/local/__tests__/claimTask.test.ts` created with comprehensive coverage
- [ ] Tool tests updated to mock service and verify integration only
- [ ] Service tests cover all claiming logic scenarios
- [ ] TypeScript compilation passes
