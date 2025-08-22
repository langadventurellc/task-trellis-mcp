---
id: T-update-service-layer-for
title: Update Service Layer for Array Input Processing
status: done
priority: high
parent: F-multiple-filter-values-for
prerequisites:
  - T-update-repository-layer-for
affectedFiles:
  src/services/TaskTrellisService.ts: Updated listObjects method signature to
    accept array union types for type, status, and priority parameters,
    maintaining backward compatibility with single values
  src/services/local/LocalTaskTrellisService.ts: Updated listObjects method
    implementation to match interface signature with array union types
  src/services/local/listObjects.ts:
    Added normalizeEnumInput helper function and
    updated listObjects function to accept array union types, normalize inputs
    to arrays, and pass arrays to repository layer
  src/services/local/__tests__/listObjects.test.ts:
    Added comprehensive test suite
    for array input processing including multiple value filtering, mixed
    single/multiple inputs, input normalization logic, and backward
    compatibility verification. Updated existing tests to expect normalized
    array format.
log:
  - Successfully updated the service layer to handle array input processing for
    multiple filter values. Implemented input normalization that converts single
    values to arrays, updated all method signatures to accept union types (T |
    T[]), and added comprehensive test coverage. All existing functionality is
    preserved through backward compatibility, and new array filtering
    capabilities work correctly.
schema: v1.0
childrenIds: []
created: 2025-08-22T04:25:28.630Z
updated: 2025-08-22T04:25:28.630Z
---

# Update Service Layer for Array Input Processing

## Context

This task updates the service layer to handle both single values and arrays for filter parameters, converting them to appropriate enum arrays before passing to the repository layer.

## Specific Implementation Requirements

### 1. Update Service Interface (`src/services/TaskTrellisService.ts`)

- Modify `listObjects` method signature to accept arrays:
  ```typescript
  listObjects(
    repository: Repository,
    type?: TrellisObjectType | TrellisObjectType[],
    scope?: string,
    status?: TrellisObjectStatus | TrellisObjectStatus[],
    priority?: TrellisObjectPriority | TrellisObjectPriority[],
    includeClosed?: boolean,
  ): Promise<{ content: Array<{ type: string; text: string }> }>;
  ```

### 2. Update LocalTaskTrellisService (`src/services/local/LocalTaskTrellisService.ts`)

- Update method signature to match interface
- Pass through array parameters to the listObjects function

### 3. Update Core Service Logic (`src/services/local/listObjects.ts`)

- Modify function signature to accept array parameters
- Update parameter destructuring and validation
- Ensure proper handling of both single values and arrays

### 4. Input Normalization Logic

- Create helper functions to normalize inputs:
  ```typescript
  const normalizeEnumInput = <T>(
    input: T | T[] | undefined,
  ): T[] | undefined => {
    if (input === undefined) return undefined;
    return Array.isArray(input) ? input : [input];
  };
  ```

## Technical Approach

1. Update method signatures to use union types for backward compatibility
2. Normalize all filter inputs to arrays early in the service layer
3. Pass normalized arrays to repository layer
4. Maintain existing error handling and response formatting

## Acceptance Criteria

- ✅ Service layer accepts both single values and arrays for type, status, priority
- ✅ Input normalization converts single values to arrays consistently
- ✅ Multiple value inputs are passed correctly to repository layer
- ✅ Backward compatibility maintained for existing single value calls
- ✅ Error handling works correctly for invalid array values
- ✅ Response formatting remains unchanged

## Testing Requirements

Create comprehensive unit tests in `src/services/local/__tests__/listObjects.test.ts`:

- Test service layer accepts multiple type values
- Test service layer accepts multiple status values
- Test service layer accepts multiple priority values
- Test mixed single/multiple value inputs
- Test input normalization logic
- Test backward compatibility with existing test cases
- Test error handling for invalid array inputs
- Verify repository calls receive properly formatted array parameters

## Dependencies

- T-update-repository-layer-for (must complete first)

## Files to Modify

- `src/services/TaskTrellisService.ts`
- `src/services/local/LocalTaskTrellisService.ts`
- `src/services/local/listObjects.ts`
- `src/services/local/__tests__/listObjects.test.ts`
