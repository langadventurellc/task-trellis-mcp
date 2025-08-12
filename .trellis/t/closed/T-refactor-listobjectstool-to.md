---
id: T-refactor-listobjectstool-to
title: Refactor listObjectsTool to use TaskTrellisService
status: done
priority: medium
prerequisites: []
affectedFiles:
  src/tools/listObjectsTool.ts: Updated handleListObjects function to accept
    TaskTrellisService parameter and delegate to service.listObjects method
  src/server.ts:
    Modified list_objects case to pass service as first parameter to
    handleListObjects
  src/services/local/__tests__/listObjects.test.ts: Created comprehensive test
    suite for listObjects service function with filtering, error handling, and
    enum validation tests
  src/tools/__tests__/listObjectsTool.test.ts: Completely refactored to mock
    TaskTrellisService and test integration only, removed business logic tests
log:
  - Successfully refactored listObjectsTool to use TaskTrellisService instead of
    direct Repository access. Updated function signature to accept service
    parameter, modified server.ts integration, created comprehensive service
    tests with business logic coverage, and updated tool tests to mock service
    and focus on integration testing only. All 798 tests pass, maintaining full
    functionality while improving code architecture and separation of concerns.
schema: v1.0
childrenIds: []
created: 2025-08-12T16:49:18.835Z
updated: 2025-08-12T16:49:18.835Z
---

# Refactor listObjectsTool to Use TaskTrellisService

## Context

The listObjectsTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.listObjects method and migrate business logic tests to service tests.

## Implementation Requirements

1. **Update handleListObjects function** (`src/tools/listObjectsTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.listObjects(repository, type, scope, status, priority, includeClosed)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify listObjects case to pass service as first parameter

3. **Migrate and update tests**:
   - **Move business logic tests**: Extract detailed filtering and listing logic tests from `src/tools/__tests__/listObjectsTool.test.ts` and move them to `src/services/local/__tests__/LocalTaskTrellisService.test.ts`
   - **Create dedicated service function tests**: Create `src/services/local/__tests__/listObjects.test.ts` with comprehensive test coverage for the `listObjects` function, including:
     - Object type filtering (project, epic, feature, task)
     - Scope-based filtering
     - Status filtering (open, in-progress, done, etc.)
     - Priority filtering (high, medium, low)
     - includeClosed parameter handling
     - Sorting logic
     - Error handling (invalid parameters, repository errors, etc.)
     - Empty result scenarios
     - All edge cases and business logic
   - **Update tool tests**: Refactor `src/tools/__tests__/listObjectsTool.test.ts` to:
     - Mock TaskTrellisService instead of Repository
     - Test only that service.listObjects is called with correct parameters
     - Keep argument parsing and validation tests
   - **Add service tests**: Ensure `LocalTaskTrellisService.listObjects` has comprehensive test coverage including filtering, sorting, status handling, and error cases

## Acceptance Criteria

- [ ] handleListObjects accepts TaskTrellisService parameter
- [ ] Function delegates to service.listObjects with all filter parameters
- [ ] server.ts integration updated
- [ ] Business logic tests moved from tool tests to service tests
- [ ] Dedicated `src/services/local/__tests__/listObjects.test.ts` created with comprehensive coverage
- [ ] Tool tests updated to mock service and verify integration only
- [ ] Service tests cover all filtering and listing scenarios
- [ ] TypeScript compilation passes
