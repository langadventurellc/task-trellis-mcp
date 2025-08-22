---
id: T-update-filterunavailableobject
title: Update filterUnavailableObjects to use hierarchical prerequisite checking
status: open
priority: high
prerequisites:
  - T-create-checkhierarchicalprereq
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-22T05:30:05.110Z
updated: 2025-08-22T05:30:05.110Z
---

## Context

The `filterUnavailableObjects` function currently only checks an object's direct prerequisites. We need to update it to use the new hierarchical prerequisite checking to ensure tasks with parent objects that have incomplete prerequisites are also filtered out.

## Current Implementation Location

`/src/utils/filterUnavailableObjects.ts`

## Implementation Requirements

Update the `filterUnavailableObjects` function to:

1. **Accept a Repository parameter** for loading parent objects
2. **Use the new `checkHierarchicalPrerequisitesComplete` function** for comprehensive checking
3. **Maintain backward compatibility** where possible

## Technical Approach

1. Update the function signature to accept a Repository:

   ```typescript
   export async function filterUnavailableObjects(
     objects: TrellisObject[],
     repository: Repository,
   ): Promise<TrellisObject[]>;
   ```

2. Modify the filtering logic:
   - Keep the isClaimable check (Rule 1)
   - Replace the simple prerequisite check with hierarchical checking
   - Optimize by bulk-loading all parent objects if needed

3. Performance optimization:
   - Consider loading all parent objects upfront to avoid N+1 queries
   - Use a cache map for parent objects within the function scope
   - Maintain early exit on first failure

## Acceptance Criteria

- [ ] Function filters out objects whose parents have incomplete prerequisites
- [ ] Function filters out objects whose grandparents/ancestors have incomplete prerequisites
- [ ] Maintains existing filtering rules (isClaimable status check)
- [ ] Performance remains acceptable for typical workloads
- [ ] All existing tests pass after updates
- [ ] New tests added for hierarchical filtering scenarios
- [ ] Function is now async and properly handles promises

## Testing Requirements

Update tests in `/src/utils/__tests__/filterUnavailableObjects.test.ts` to:

- Test filtering with parent prerequisites
- Test filtering with grandparent prerequisites
- Test mixed scenarios (some tasks filtered, some not)
- Verify performance with large object lists
- Ensure backward compatibility scenarios work

## Files to Modify

- Modify: `/src/utils/filterUnavailableObjects.ts`
- Modify: `/src/utils/__tests__/filterUnavailableObjects.test.ts`

## Breaking Changes

Note: This changes the function signature to be async and require a Repository parameter. All callers will need to be updated.
