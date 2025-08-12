---
id: T-refactor-createobjecttool-to
title: Refactor createObjectTool to use TaskTrellisService
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-12T16:48:58.878Z
updated: 2025-08-12T16:48:58.878Z
---

# Refactor createObjectTool to Use TaskTrellisService

## Context

The createObjectTool currently uses Repository directly. Need to refactor it to use TaskTrellisService dependency injection pattern like server.ts already sets up.

## Implementation Requirements

1. **Update handleCreateObject function** (`src/tools/createObjectTool.ts`):
   - Change signature from `(repository: Repository, args: unknown)` to `(service: TaskTrellisService, repository: Repository, args: unknown)`
   - Replace business logic with call to `service.createObject(repository, ...args)`
   - Remove validation and object creation logic (now handled by service)
   - Keep argument parsing and validation

2. **Update server.ts**:
   - Modify createObject case to pass service as first parameter to handleCreateObject

3. **Update tool tests** (`src/tools/__tests__/createObjectTool.test.ts`):
   - Mock TaskTrellisService instead of Repository methods
   - Test only that handleCreateObject calls service.createObject with correct parameters
   - Remove detailed business logic tests (these belong in service tests now)
   - Keep argument validation tests

## Acceptance Criteria

- [ ] handleCreateObject function signature updated to accept TaskTrellisService
- [ ] Function delegates to service.createObject with proper parameters
- [ ] server.ts passes service to handleCreateObject
- [ ] Unit tests mock service and verify correct service method calls
- [ ] All existing functionality preserved
- [ ] TypeScript compilation passes

## Testing Requirements

Write unit tests that verify:

- handleCreateObject calls service.createObject with correct parameters
- Proper error handling when service throws errors
- Argument parsing and validation still works
