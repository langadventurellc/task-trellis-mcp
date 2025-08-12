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

The pruneClosedTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.pruneClosed method and migrate business logic tests to service tests.

## Implementation Requirements

1. **Update handlePruneClosed function** (`src/tools/pruneClosedTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.pruneClosed(repository, age, scope)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify pruneClosed case to pass service as first parameter

3. **Migrate and update tests**:
   - **Move business logic tests**: Extract detailed pruning logic tests from `src/tools/__tests__/pruneClosedTool.test.ts` and move them to `src/services/local/__tests__/LocalTaskTrellisService.test.ts`
   - **Create dedicated service function tests**: Create `src/services/local/__tests__/pruneClosed.test.ts` with comprehensive test coverage for the `pruneClosed` function, including:
     - Normal pruning scenarios with various age thresholds
     - Scope-based filtering during pruning
     - Closed object identification and removal
     - Dependency checking before removal
     - Error handling (invalid age, repository errors, etc.)
     - Edge cases (no objects to prune, all objects recently closed, etc.)
     - File system cleanup operations
     - Safety mechanisms and validation
     - All business logic scenarios
   - **Update tool tests**: Refactor `src/tools/__tests__/pruneClosedTool.test.ts` to:
     - Mock TaskTrellisService instead of Repository
     - Test only that service.pruneClosed is called with correct parameters
     - Keep argument parsing and validation tests
   - **Add service tests**: Ensure `LocalTaskTrellisService.pruneClosed` has comprehensive test coverage including error handling, pruning logic, and edge cases

## Acceptance Criteria

- [ ] handlePruneClosed accepts TaskTrellisService parameter
- [ ] Function delegates to service.pruneClosed with all parameters
- [ ] server.ts integration updated
- [ ] Business logic tests moved from tool tests to service tests
- [ ] Dedicated `src/services/local/__tests__/pruneClosed.test.ts` created with comprehensive coverage
- [ ] Tool tests updated to mock service and verify integration only
- [ ] Service tests cover all pruning logic scenarios
- [ ] TypeScript compilation passes
