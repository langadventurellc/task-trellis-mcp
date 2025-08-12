---
id: T-refactor-listobjectstool-to
title: Refactor listObjectsTool to use TaskTrellisService
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
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
- [ ] Tool tests updated to mock service and verify integration only
- [ ] Service tests cover all filtering and listing scenarios
- [ ] TypeScript compilation passes
