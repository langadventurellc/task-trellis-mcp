---
id: T-refactor-replaceobjectbodyrege
title: Refactor replaceObjectBodyRegexTool to use TaskTrellisService
status: done
priority: medium
prerequisites: []
affectedFiles:
  src/tools/replaceObjectBodyRegexTool.ts: Updated handleReplaceObjectBodyRegex
    function to accept TaskTrellisService as first parameter and delegate to
    service.replaceObjectBodyRegex method
  src/server.ts: Modified replaceObjectBodyRegex case to pass _getService() as
    first parameter to handleReplaceObjectBodyRegex
  src/services/local/__tests__/replaceObjectBodyRegex.test.ts:
    Created comprehensive service test file with detailed coverage of regex
    replacement logic, error handling, multiple occurrences, and edge cases
  src/tools/__tests__/replaceObjectBodyRegexTool.test.ts:
    Refactored tool tests to
    mock TaskTrellisService instead of Repository, focusing on parameter parsing
    and service integration verification
log:
  - Successfully refactored replaceObjectBodyRegexTool to use TaskTrellisService
    instead of Repository directly. Updated function signature to accept
    TaskTrellisService as first parameter and delegate all business logic to
    service.replaceObjectBodyRegex. Migrated comprehensive business logic tests
    from tool tests to dedicated service tests, and updated tool tests to mock
    service integration only. All 816 tests pass, confirming functionality
    remains intact.
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
   - **Create dedicated service function tests**: Create `src/services/local/__tests__/replaceObjectBodyRegex.test.ts` with comprehensive test coverage for the `replaceObjectBodyRegex` function, including:
     - Normal regex replacement scenarios
     - Single vs multiple occurrence handling
     - allowMultipleOccurrences parameter behavior
     - Complex regex patterns and edge cases
     - Error handling (object not found, invalid regex, etc.)
     - Empty string and null value handling
     - Large text body performance
     - Regex match validation and safety
     - All business logic scenarios
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
- [ ] Dedicated `src/services/local/__tests__/replaceObjectBodyRegex.test.ts` created with comprehensive coverage
- [ ] Tool tests updated to mock service and verify integration only
- [ ] Service tests cover all regex replacement scenarios
- [ ] TypeScript compilation passes
