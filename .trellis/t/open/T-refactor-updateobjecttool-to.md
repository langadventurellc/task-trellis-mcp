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

The updateObjectTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.updateObject method and migrate business logic tests to service tests.

## Implementation Requirements

1. **Update handleUpdateObject function** (`src/tools/updateObjectTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.updateObject(repository, id, priority, prerequisites, body, status, force)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify updateObject case to pass service as first parameter

3. **Migrate and update tests**:
   - **Move business logic tests**: Extract detailed update logic tests from `src/tools/__tests__/updateObjectTool.test.ts` and move them to `src/services/local/__tests__/LocalTaskTrellisService.test.ts`
   - **Update tool tests**: Refactor `src/tools/__tests__/updateObjectTool.test.ts` to:
     - Mock TaskTrellisService instead of Repository
     - Test only that service.updateObject is called with correct parameters
     - Keep argument parsing and validation tests
   - **Add service tests**: Ensure `LocalTaskTrellisService.updateObject` has comprehensive test coverage including error handling, update logic, validation, and status changes

## Acceptance Criteria

- [ ] handleUpdateObject accepts TaskTrellisService parameter
- [ ] Function delegates to service.updateObject with all parameters
- [ ] server.ts integration updated
- [ ] Business logic tests moved from tool tests to service tests
- [ ] Tool tests updated to mock service and verify integration only
- [ ] Service tests cover all update logic scenarios
- [ ] TypeScript compilation passes
