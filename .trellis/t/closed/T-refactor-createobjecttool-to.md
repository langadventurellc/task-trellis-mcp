---
id: T-refactor-createobjecttool-to
title: Refactor createObjectTool to use TaskTrellisService
status: done
priority: medium
prerequisites: []
affectedFiles:
  src/tools/createObjectTool.ts:
    Updated handleCreateObject function signature and
    implementation to delegate to TaskTrellisService
  src/server.ts:
    Modified createObject case to pass service as first parameter to
    handleCreateObject
  src/tools/__tests__/createObjectTool.test.ts: Refactored tests to mock
    TaskTrellisService instead of Repository and verify correct service method
    calls
  src/services/local/__tests__/createObject.test.ts: Created comprehensive test
    suite with full coverage for createObject function including normal
    scenarios, error handling, validation, and edge cases
log:
  - Successfully refactored createObjectTool to use TaskTrellisService
    dependency injection pattern. Updated handleCreateObject function signature
    to accept TaskTrellisService as first parameter and delegate business logic
    to service.createObject. Created comprehensive tests for the service
    function with full coverage of object creation scenarios, validation,
    hierarchy rules, and error handling. Updated tool tests to mock
    TaskTrellisService and verify correct service method calls. All quality
    checks and tests pass.
schema: v1.0
childrenIds: []
created: 2025-08-12T16:48:58.878Z
updated: 2025-08-12T16:48:58.878Z
---

# Refactor createObjectTool to Use TaskTrellisService

## Context

The createObjectTool currently uses Repository directly. Need to refactor it to use TaskTrellisService dependency injection pattern like server.ts already sets up, and migrate business logic tests to service tests.

## Implementation Requirements

1. **Update handleCreateObject function** (`src/tools/createObjectTool.ts`):
   - Change signature from `(repository: Repository, args: unknown)` to `(service: TaskTrellisService, repository: Repository, args: unknown)`
   - Replace business logic with call to `service.createObject(repository, ...args)`
   - Remove validation and object creation logic (now handled by service)
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify createObject case to pass service as first parameter to handleCreateObject

3. **Migrate and update tests**:
   - **Move business logic tests**: Extract detailed business logic tests from `src/tools/__tests__/createObjectTool.test.ts` and move them to `src/services/local/__tests__/LocalTaskTrellisService.test.ts`
   - **Create dedicated service function tests**: Create `src/services/local/__tests__/createObject.test.ts` with comprehensive test coverage for the `createObject` function, including:
     - Normal object creation scenarios for all types (project, epic, feature, task)
     - Parent-child hierarchy validation
     - Prerequisites handling
     - Status and priority validation
     - Error handling (validation errors, parent not found, etc.)
     - Unique ID generation
     - File system operations
     - All edge cases and business logic
   - **Update tool tests**: Refactor `src/tools/__tests__/createObjectTool.test.ts` to:
     - Mock TaskTrellisService instead of Repository methods
     - Test only that handleCreateObject calls service.createObject with correct parameters
     - Keep argument validation tests
   - **Add service tests**: Ensure `LocalTaskTrellisService.createObject` has comprehensive test coverage including object creation, validation, hierarchy rules, and error handling

## Acceptance Criteria

- [ ] handleCreateObject function signature updated to accept TaskTrellisService
- [ ] Function delegates to service.createObject with proper parameters
- [ ] server.ts passes service to handleCreateObject
- [ ] Business logic tests moved from tool tests to service tests
- [ ] Dedicated `src/services/local/__tests__/createObject.test.ts` created with comprehensive coverage
- [ ] Tool tests updated to mock service and verify correct service method calls
- [ ] Service tests cover all object creation scenarios
- [ ] All existing functionality preserved
- [ ] TypeScript compilation passes

## Testing Requirements

Write unit tests that verify:

- handleCreateObject calls service.createObject with correct parameters
- Proper error handling when service throws errors
- Argument parsing and validation still works
