---
id: T-update-tool-handler-for-array
title: Update Tool Handler for Array Processing and Validation
status: done
priority: high
parent: F-multiple-filter-values-for
prerequisites:
  - T-update-tool-schema-for
affectedFiles:
  src/tools/listObjectsTool.ts: Updated handleListObjects function with enhanced
    array-aware enum conversion helpers (toTypeArray, toStatusArray,
    toPriorityArray) that handle both single values and arrays directly, added
    validation to ensure at least one filter is provided when type is optional,
    enhanced error handling to identify specific invalid array elements with
    detailed error messages, and proper empty array handling as no filter
    provided
  src/tools/__tests__/listObjectsTool.test.ts: Added comprehensive test coverage
    for enhanced array functionality including tests for multiple invalid values
    in arrays, empty array handling as no filter provided, validation when no
    filters provided, and mixed scenarios with scope filters. All new tests
    ensure backward compatibility is maintained.
log:
  - Enhanced listObjectsTool handler with improved array processing and
    validation. Implemented direct array-aware enum conversion functions that
    handle both single values and arrays, added validation to ensure at least
    one filter is provided when type is optional, enhanced error handling to
    identify specific invalid elements in arrays with clear messages, and proper
    handling of empty arrays as no filter provided. All backward compatibility
    maintained with existing single value functionality.
schema: v1.0
childrenIds: []
created: 2025-08-22T04:26:08.641Z
updated: 2025-08-22T04:26:08.641Z
---

# Update Tool Handler for Array Processing and Validation

## Context

This task updates the `handleListObjects` function to process both single values and arrays for filter parameters, convert them to appropriate enum arrays, and enhance error handling for multiple values.

## Specific Implementation Requirements

### 1. Update Parameter Destructuring (`src/tools/listObjectsTool.ts`)

- Update the args destructuring to handle array inputs
- Make type parameter truly optional in the handler logic
- Add validation to ensure at least one filter is provided when type is optional

### 2. Enhance Enum Conversion Helper Functions

- Update `toType`, `toStatus`, `toPriority` functions to handle arrays:
  ```typescript
  const toTypeArray = (
    input: string | string[] | undefined,
  ): TrellisObjectType[] | undefined => {
    if (!input) return undefined;
    const values = Array.isArray(input) ? input : [input];
    return values.map((value) => {
      if (
        Object.values(TrellisObjectType).includes(value as TrellisObjectType)
      ) {
        return value as TrellisObjectType;
      }
      throw new Error(`Invalid type value: ${value}`);
    });
  };
  ```

### 3. Enhanced Error Handling

- Provide specific error messages for invalid array elements
- Identify which specific values in an array are invalid
- Handle mixed valid/invalid values appropriately
- Ensure empty arrays are treated as filter not provided

### 4. Service Layer Integration

- Pass converted enum arrays to service layer
- Ensure backward compatibility with existing single value logic
- Update service method call to pass optional type parameter

## Technical Approach

1. Create new helper functions for array-aware enum conversion
2. Add validation to ensure at least one filter when type is optional
3. Enhance error messages to be specific about invalid array elements
4. Use existing service layer interface with new array parameters

## Acceptance Criteria

- ✅ Handler processes both single values and arrays for all filter types
- ✅ Type parameter is truly optional and handler works without it
- ✅ Validation ensures at least one filter is provided when type omitted
- ✅ Enum conversion works correctly for arrays with clear error messages
- ✅ Invalid array elements produce specific error messages
- ✅ Backward compatibility maintained for existing single value calls
- ✅ Empty arrays are treated as filter not provided

## Testing Requirements

Create comprehensive unit tests in `src/tools/__tests__/listObjectsTool.test.ts`:

- Test handler processes multiple type values correctly
- Test handler processes multiple status values correctly
- Test handler processes multiple priority values correctly
- Test optional type parameter behavior
- Test validation when no filters provided
- Test error handling for invalid array elements
- Test mixed valid/invalid values in arrays
- Test backward compatibility with existing single value scenarios
- Test empty array handling

## Dependencies

- T-update-tool-schema-for (schema must accept arrays first)

## Files to Modify

- `src/tools/listObjectsTool.ts` (handleListObjects function)
- `src/tools/__tests__/listObjectsTool.test.ts`
