---
id: T-fix-auto-prune-hierarchical
title: Fix auto-prune hierarchical validation to check all descendants recursively
status: done
priority: high
prerequisites: []
affectedFiles:
  src/services/local/pruneClosed.ts:
    Added hasOpenDescendants() recursive function
    and updated main pruneClosed logic to use recursive descendant checking
    instead of direct child checking
  src/services/local/__tests__/pruneClosed.test.ts: Fixed existing multi-level
    hierarchy test expectations and added comprehensive test suite for deep
    hierarchies, mixed scenarios, circular reference protection, and error
    handling
log:
  - >-
    Successfully implemented recursive descendant checking for auto-prune
    functionality. The previous implementation only checked direct children when
    determining if a closed object could be safely deleted, which led to the bug
    where closed epics with closed features that had open tasks were incorrectly
    deleted.


    Key changes made:

    1. Added hasOpenDescendants() recursive function that traverses the entire
    descendant tree

    2. Replaced direct child checking with recursive descendant checking in
    pruneClosed()

    3. Added comprehensive error handling and circular reference protection

    4. Fixed existing test expectations to match corrected behavior

    5. Added extensive test coverage for deep hierarchies (4+ levels), mixed
    scenarios, edge cases


    The fix ensures that any object with open descendants at ANY level is
    protected from deletion, while still allowing deletion of objects with only
    closed descendants. All 23 tests pass including new comprehensive test cases
    covering deep hierarchies, mixed branch scenarios, circular reference
    protection, and error handling.
schema: v1.0
childrenIds: []
created: 2025-08-22T19:29:12.771Z
updated: 2025-08-22T19:29:12.771Z
---

# Fix auto-prune hierarchical validation to check all descendants recursively

## Context

Currently, the auto-prune functionality in `pruneClosed.ts` only checks direct children when determining if a closed object can be safely deleted. This means a closed epic with a closed feature that has an open task gets deleted (because the epic has no direct open children), when it should be protected because it has open descendants at any level.

## Problem

The current implementation in `src/services/local/pruneClosed.ts` line ~32:

```typescript
const children = await repository.getChildrenOf(obj.id, true);
const hasOpenChildren = children.some((child) => isOpen(child));
```

This only checks immediate children, not grandchildren, great-grandchildren, etc.

## Implementation Requirements

### Core Changes

1. **Create recursive descendant checking function**:
   - Create a new helper function `hasOpenDescendants(objectId: string, repository: Repository): Promise<boolean>`
   - Should recursively traverse the entire descendant tree
   - Return `true` if ANY descendant at any level is open
   - Handle circular references gracefully (though they shouldn't exist in a well-formed hierarchy)

2. **Update pruneClosed logic**:
   - Replace the current `getChildrenOf` + `some` logic with the new recursive function
   - Ensure proper error handling during recursive traversal
   - Maintain performance by stopping traversal as soon as an open descendant is found

3. **Add comprehensive unit tests**:
   - Test deep hierarchy: Project → Epic → Feature → Task (open task should protect all ancestors)
   - Test multiple levels: Epic with 3+ levels of descendants
   - Test mixed scenarios: Some branches have open descendants, others don't
   - Test edge cases: Empty hierarchy, single-level hierarchy
   - Test performance: Ensure recursive checking doesn't cause timeouts

### Technical Approach

1. **Implement recursive helper function**:

   ```typescript
   async function hasOpenDescendants(
     objectId: string,
     repository: Repository,
     visited: Set<string> = new Set(),
   ): Promise<boolean> {
     // Prevent infinite loops
     if (visited.has(objectId)) return false;
     visited.add(objectId);

     // Get all children (including closed ones)
     const children = await repository.getChildrenOf(objectId, true);

     // Check if any direct children are open
     for (const child of children) {
       if (isOpen(child)) return true;

       // Recursively check descendants
       if (await hasOpenDescendants(child.id, repository, visited)) {
         return true;
       }
     }

     return false;
   }
   ```

2. **Update pruneClosed function**:
   - Replace line ~33: `const hasOpenChildren = children.some((child) => isOpen(child));`
   - With: `const hasOpenDescendants = await hasOpenDescendantsFunc(obj.id, repository);`

3. **Error handling**:
   - Wrap recursive calls in try-catch
   - Continue processing other objects if one fails
   - Log errors appropriately

## Files to Modify

- `src/services/local/pruneClosed.ts` - Main implementation
- `src/services/local/__tests__/pruneClosed.test.ts` - Add comprehensive test cases

## Acceptance Criteria

- [ ] Recursive descendant checking function implemented and tested
- [ ] Auto-prune correctly protects objects with open descendants at ANY level
- [ ] Closed objects with only closed descendants are still deleted correctly
- [ ] Performance remains acceptable (no timeouts on reasonable hierarchy depths)
- [ ] All existing unit tests continue to pass
- [ ] New unit tests cover deep hierarchies (4+ levels)
- [ ] New unit tests cover mixed scenarios with multiple branches
- [ ] Error handling prevents infinite loops and gracefully handles traversal failures
- [ ] Updated E2E tests reflect corrected behavior

## Dependencies

None - this is a standalone bug fix.

## Security Considerations

- Prevent infinite loops through cycle detection
- Ensure traversal doesn't expose unauthorized object data
- Maintain proper error boundaries to prevent information leakage

## Testing Requirements

Include comprehensive unit tests covering:

- Deep hierarchies (Project → Epic → Feature → Task → Subtask)
- Mixed scenarios (some branches open, others closed)
- Edge cases (empty hierarchy, circular references)
- Performance with realistic hierarchy sizes
