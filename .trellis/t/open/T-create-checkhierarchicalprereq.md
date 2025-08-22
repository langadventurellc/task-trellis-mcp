---
id: T-create-checkhierarchicalprereq
title: Create checkHierarchicalPrerequisitesComplete utility function
status: open
priority: high
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-22T05:29:31.482Z
updated: 2025-08-22T05:29:31.482Z
---

## Context

Currently, the system only checks prerequisites at the individual task level. We need to expand prerequisite checking to include the entire parent hierarchy (Feature → Epic → Project), so that if a parent has incomplete prerequisites, all its child tasks are excluded from being claimable.

## Implementation Requirements

Create a new utility function `checkHierarchicalPrerequisitesComplete` in `/src/utils/` that:

1. **Checks the object's own prerequisites** using the existing `checkPrerequisitesComplete()` function
2. **Recursively traverses the parent hierarchy** to check prerequisites at each level
3. **Returns false if any level has incomplete prerequisites**

## Technical Approach

1. Create new file `/src/utils/checkHierarchicalPrerequisitesComplete.ts`
2. Import necessary dependencies:
   - `TrellisObject` from models
   - `Repository` from repositories
   - Existing `checkPrerequisitesComplete` function

3. Implement the function with this signature:

   ```typescript
   export async function checkHierarchicalPrerequisitesComplete(
     trellisObject: TrellisObject,
     repository: Repository,
     visitedIds: Set<string> = new Set(), // Prevent circular references
   ): Promise<boolean>;
   ```

4. Implementation logic:
   - First check the object's own prerequisites
   - If the object has a parent, load it and recursively check its prerequisites
   - Use visitedIds Set to prevent infinite loops from circular references
   - Early exit on first failure for performance

## Acceptance Criteria

- [ ] Function correctly checks prerequisites at all hierarchy levels
- [ ] Handles missing parent objects gracefully (returns true if parent not found)
- [ ] Prevents infinite loops with circular parent references
- [ ] Includes comprehensive unit tests covering:
  - Object with no prerequisites
  - Object with complete prerequisites
  - Object with incomplete prerequisites
  - Parent with incomplete prerequisites
  - Grandparent with incomplete prerequisites
  - Missing parent object
  - Circular reference protection
- [ ] Performance is acceptable (completes in < 100ms for typical hierarchy)
- [ ] Exports function from `/src/utils/index.ts`

## Testing Requirements

Create unit tests in `/src/utils/__tests__/checkHierarchicalPrerequisitesComplete.test.ts` that verify:

- Basic prerequisite checking at object level
- Hierarchical checking through multiple parent levels
- Edge cases (missing parents, circular references)
- Performance with deep hierarchies

## Files to Create/Modify

- Create: `/src/utils/checkHierarchicalPrerequisitesComplete.ts`
- Create: `/src/utils/__tests__/checkHierarchicalPrerequisitesComplete.test.ts`
- Modify: `/src/utils/index.ts` (add export)
