---
id: T-refactor-replaceobjectbodyrege
title: Refactor replaceObjectBodyRegexTool to use TaskTrellisService
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-12T16:51:13.035Z
updated: 2025-08-12T16:51:13.035Z
---

# Refactor replaceObjectBodyRegexTool to Use TaskTrellisService

## Context

The replaceObjectBodyRegexTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.replaceObjectBodyRegex method and migrate business logic tests to service tests.

## Implementation Requirements

1. **Update handleReplaceObjectBodyRegex function** (`src/tools/replaceObjectBodyRegexTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.replaceObjectBodyRegex(repository, id, regex, replacement, allowMultipleOccurrences)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify replaceObjectBodyRegex case to pass service as first parameter

3. **Migrate and update tests**:
   - **Move business logic tests**: Extract detailed regex replacement logic tests from `src/tools/__tests__/replaceObjectBodyRegexTool.test.ts` and move them to `src/services/local/__tests__/LocalTaskTrellisService.test.ts`
   - **Update tool tests**: Refactor `src/tools/__tests__/replaceObjectBodyRegexTool.test.ts` to:
     - Mock TaskTrellisService instead of Repository
     - Test only that service.replaceObjectBodyRegex is called with correct parameters
     - Keep argument parsing and validation tests
   - **Add service tests**: Ensure `LocalTaskTrellisService.replaceObjectBodyRegex` has comprehensive test coverage including error handling, regex replacement logic, and edge cases

## Acceptance Criteria

- [ ] handleReplaceObjectBodyRegex accepts TaskTrellisService parameter
- [ ] Function delegates to service.replaceObjectBodyRegex with all parameters
- [ ] server.ts integration updated
- [ ] Business logic tests moved from tool tests to service tests
- [ ] Tool tests updated to mock service and verify integration only
- [ ] Service tests cover all regex replacement scenarios
- [ ] TypeScript compilation passes
