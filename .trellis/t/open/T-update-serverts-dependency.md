---
id: T-update-serverts-dependency
title: Update server.ts dependency injection for all refactored tools
status: open
priority: high
prerequisites:
  - T-refactor-createobjecttool-to
  - T-refactor-listobjectstool-to
  - T-refactor-updateobjecttool-to
  - T-refactor-claimtasktool-to-use
  - T-refactor-completetasktool-to
  - T-refactor-appendobjectlogtool
  - T-refactor-pruneclosedtool-to
  - T-refactor-replaceobjectbodyrege
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-12T16:51:31.703Z
updated: 2025-08-12T16:51:31.703Z
---

# Update server.ts Dependency Injection for All Refactored Tools

## Context

After all tools have been refactored to use TaskTrellisService, the server.ts file needs to be updated to pass the service instance to all the refactored tool handlers.

## Implementation Requirements

1. **Update server.ts** (`src/server.ts`):
   - Modify the `_getService()` function if needed to ensure proper service instantiation
   - Update all tool handler calls in the switch statement to pass service as first parameter:
     - `handleCreateObject(service, repository, args)`
     - `handleListObjects(service, repository, args)`
     - `handleUpdateObject(service, repository, args)`
     - `handleClaimTask(service, repository, args)`
     - `handleCompleteTask(service, repository, args)`
     - `handleAppendObjectLog(service, repository, args)`
     - `handlePruneClosed(service, repository, args)`
     - `handleReplaceObjectBodyRegex(service, repository, args)`
   - Keep existing handlers for getObject, deleteObject, and activate unchanged

2. **Verify imports**:
   - Ensure TaskTrellisService import is correct
   - Verify all handler function imports are correct

## Acceptance Criteria

- [ ] All refactored tools receive service as first parameter in server.ts
- [ ] Non-refactored tools (getObject, deleteObject, activate) remain unchanged
- [ ] Service instantiation works correctly
- [ ] All tool calls work end-to-end
- [ ] TypeScript compilation passes
- [ ] Integration testing confirms all tools work with service injection

## Testing Requirements

- Manual testing of each refactored tool to ensure functionality is preserved
- Verify service instance is correctly passed and used by each tool
