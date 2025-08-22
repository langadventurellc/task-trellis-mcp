---
id: T-update-claimtask-service-to
title: Update claimTask service to use hierarchical prerequisite checking
status: done
priority: high
prerequisites:
  - T-create-checkhierarchicalprereq
  - T-update-filterunavailableobject
affectedFiles:
  src/services/local/claimTask.ts: Updated to use
    checkHierarchicalPrerequisitesComplete instead of checkPrerequisitesComplete
    in validateTaskForClaiming function. Added logic to provide specific error
    messages when parent hierarchy has incomplete prerequisites vs task's own
    prerequisites.
  src/services/local/__tests__/claimTask.test.ts: Added comprehensive test
    coverage for hierarchical prerequisite checking including tests for parent
    feature prerequisites, grandparent epic prerequisites, force flag bypass,
    findNextAvailableTask filtering, and specific error message scenarios.
    Updated existing tests to properly mock the new hierarchical functions.
log:
  - Successfully updated claimTask service to use hierarchical prerequisite
    checking. Replaced checkPrerequisitesComplete with
    checkHierarchicalPrerequisitesComplete in validation logic, added specific
    error messages to distinguish between task prerequisites vs parent hierarchy
    prerequisites, and added comprehensive test coverage. All tests pass
    (585/585) and quality checks are clean.
schema: v1.0
childrenIds: []
created: 2025-08-22T05:30:41.292Z
updated: 2025-08-22T05:30:41.292Z
---

## Context

The `claimTask` service currently validates prerequisites only at the task level. We need to update it to use hierarchical prerequisite checking to prevent claiming tasks whose parent objects have incomplete prerequisites.

## Current Implementation Location

`/src/services/local/claimTask.ts`

## Implementation Requirements

Update the claimTask service to:

1. **Use `checkHierarchicalPrerequisitesComplete`** in the validation logic
2. **Update `filterUnavailableObjects` call** with the new Repository parameter
3. **Provide clear error messages** when tasks can't be claimed due to parent prerequisites

## Technical Approach

1. In `validateTaskForClaiming` function (line ~122-154):
   - Replace `checkPrerequisitesComplete` with `checkHierarchicalPrerequisitesComplete`
   - Update error message to indicate if parent prerequisites are blocking

2. In `findNextAvailableTask` function (line ~71-91):
   - Update the call to `filterUnavailableObjects` to pass the repository parameter
   - Handle the async nature of the updated function

3. Error message improvements:
   ```typescript
   // Provide specific feedback about what's blocking
   if (!prerequisitesComplete) {
     // Determine if it's the task's own prerequisites or a parent's
     const ownPrerequisitesComplete = await checkPrerequisitesComplete(
       task,
       repository,
     );
     if (ownPrerequisitesComplete) {
       throw new Error(
         `Task "${taskId}" cannot be claimed. Parent hierarchy has incomplete prerequisites.`,
       );
     } else {
       throw new Error(
         `Task "${taskId}" cannot be claimed. Not all prerequisites are complete.`,
       );
     }
   }
   ```

## Acceptance Criteria

- [ ] Tasks with parent objects that have incomplete prerequisites cannot be claimed
- [ ] Specific error messages indicate whether task or parent prerequisites are blocking
- [ ] The `force` flag bypasses hierarchical prerequisite checking
- [ ] `findNextAvailableTask` correctly filters out tasks with parent prerequisite issues
- [ ] All existing tests pass with updated logic
- [ ] New tests verify hierarchical blocking scenarios

## Testing Requirements

Update tests in `/src/services/local/__tests__/claimTask.test.ts` to:

- Test claiming blocked by parent feature prerequisites
- Test claiming blocked by grandparent epic prerequisites
- Test force flag bypasses hierarchical checking
- Test findNextAvailableTask excludes hierarchically blocked tasks
- Verify specific error messages for different blocking scenarios

## Files to Modify

- Modify: `/src/services/local/claimTask.ts`
- Modify: `/src/services/local/__tests__/claimTask.test.ts`

## Dependencies

This task depends on:

- T-create-checkhierarchicalprereq (new utility function)
- T-update-filterunavailableobject (updated filter function)
