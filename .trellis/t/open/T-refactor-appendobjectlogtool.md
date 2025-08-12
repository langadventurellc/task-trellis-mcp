---
id: T-refactor-appendobjectlogtool
title: Refactor appendObjectLogTool to use TaskTrellisService
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-12T16:50:52.617Z
updated: 2025-08-12T16:50:52.617Z
---

# Refactor appendObjectLogTool to Use TaskTrellisService

## Context

The appendObjectLogTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.appendObjectLog method and migrate business logic tests to service tests.

## Implementation Requirements

1. **Update handleAppendObjectLog function** (`src/tools/appendObjectLogTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.appendObjectLog(repository, id, contents)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify appendObjectLog case to pass service as first parameter

3. **Migrate and update tests**:
   - **Move business logic tests**: Extract detailed log appending logic tests from `src/tools/__tests__/appendObjectLogTool.test.ts` and move them to `src/services/local/__tests__/LocalTaskTrellisService.test.ts`
   - **Update tool tests**: Refactor `src/tools/__tests__/appendObjectLogTool.test.ts` to:
     - Mock TaskTrellisService instead of Repository
     - Test only that service.appendObjectLog is called with correct parameters
     - Keep argument parsing and validation tests
   - **Add service tests**: Ensure `LocalTaskTrellisService.appendObjectLog` has comprehensive test coverage including error handling, validation, and business logic

## Acceptance Criteria

- [ ] handleAppendObjectLog accepts TaskTrellisService parameter
- [ ] Function delegates to service.appendObjectLog with all parameters
- [ ] server.ts integration updated
- [ ] Business logic tests moved from tool tests to service tests
- [ ] Tool tests updated to mock service and verify integration only
- [ ] Service tests cover all business logic scenarios
- [ ] TypeScript compilation passes
