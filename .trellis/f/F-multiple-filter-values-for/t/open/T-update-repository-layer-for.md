---
id: T-update-repository-layer-for
title: Update Repository Layer for Multiple Value Filtering
status: open
priority: high
parent: F-multiple-filter-values-for
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-22T04:25:12.334Z
updated: 2025-08-22T04:25:12.334Z
---

# Update Repository Layer for Multiple Value Filtering

## Context

This task implements the foundation for multiple value filtering by updating the repository layer to accept and process arrays of enum values for type, status, and priority filters.

## Specific Implementation Requirements

### 1. Update Repository Interface (`src/repositories/Repository.ts`)

- Modify `getObjects` method signature to accept arrays:
  ```typescript
  getObjects(
    includeClosed?: boolean,
    scope?: string,
    type?: TrellisObjectType | TrellisObjectType[],
    status?: TrellisObjectStatus | TrellisObjectStatus[],
    priority?: TrellisObjectPriority | TrellisObjectPriority[],
  ): Promise<TrellisObject[]>;
  ```

### 2. Update LocalRepository Implementation (`src/repositories/local/LocalRepository.ts`)

- Update the `getObjects` method to pass through the new array parameters
- Ensure backward compatibility with single value inputs

### 3. Update Core Filtering Logic (`src/repositories/local/getObjects.ts`)

- Modify the `getObjects` function signature to match the interface
- Update filtering logic to handle both single values and arrays:
  - Convert single values to arrays internally for consistent processing
  - Use `Array.includes()` for membership testing against filter arrays
  - Maintain existing performance characteristics

### 4. Filtering Logic Implementation

```typescript
// Example logic for type filtering
const typeArray = Array.isArray(type) ? type : type ? [type] : undefined;
if (typeArray && !typeArray.includes(trellisObject.type)) {
  continue; // Skip if type doesn't match any in the array
}
```

## Technical Approach

1. Use union types (`T | T[]`) in interface for backward compatibility
2. Normalize inputs to arrays early in the function
3. Apply filtering using array membership tests
4. Preserve existing error handling patterns

## Acceptance Criteria

- ✅ Repository interface accepts both single values and arrays for type, status, priority
- ✅ Single value inputs continue working unchanged (backward compatibility)
- ✅ Multiple value inputs filter correctly using OR logic within each filter type
- ✅ Combined multiple filters work correctly (AND logic between filter types)
- ✅ Performance remains optimal for both single and multiple value scenarios
- ✅ Existing error handling and edge cases are preserved

## Testing Requirements

Create comprehensive unit tests in `src/repositories/local/__tests__/getObjects.test.ts`:

- Test multiple type values: `[TrellisObjectType.FEATURE, TrellisObjectType.TASK]`
- Test multiple status values: `[TrellisObjectStatus.OPEN, TrellisObjectStatus.IN_PROGRESS]`
- Test multiple priority values: `[TrellisObjectPriority.HIGH, TrellisObjectPriority.MEDIUM]`
- Test mixed single/multiple filters
- Test backward compatibility with existing single value calls
- Test empty arrays (should be treated as filter not provided)
- Test performance with large filter arrays

## Dependencies

None - this is the foundation task that other tasks will depend on.

## Files to Modify

- `src/repositories/Repository.ts`
- `src/repositories/local/LocalRepository.ts`
- `src/repositories/local/getObjects.ts`
- `src/repositories/local/__tests__/getObjects.test.ts`
