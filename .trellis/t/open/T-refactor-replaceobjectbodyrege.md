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

The replaceObjectBodyRegexTool currently uses Repository directly. Need to refactor it to use TaskTrellisService.replaceObjectBodyRegex method.

## Implementation Requirements

1. **Update handleReplaceObjectBodyRegex function** (`src/tools/replaceObjectBodyRegexTool.ts`):
   - Change signature to accept TaskTrellisService as first parameter
   - Replace business logic with call to `service.replaceObjectBodyRegex(repository, id, regex, replacement, allowMultipleOccurrences)`
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify replaceObjectBodyRegex case to pass service as first parameter

3. **Update tool tests** (`src/tools/__tests__/replaceObjectBodyRegexTool.test.ts`):
   - Mock TaskTrellisService instead of Repository
   - Test only that service.replaceObjectBodyRegex is called with correct parameters
   - Remove detailed regex replacement logic tests

## Acceptance Criteria

- [ ] handleReplaceObjectBodyRegex accepts TaskTrellisService parameter
- [ ] Function delegates to service.replaceObjectBodyRegex with all parameters
- [ ] server.ts integration updated
- [ ] Unit tests verify service calls
- [ ] TypeScript compilation passes
