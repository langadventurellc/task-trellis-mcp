---
id: F-multiple-filter-values-for
title: Multiple Filter Values for List Objects
status: in-progress
priority: medium
prerequisites: []
affectedFiles:
  src/repositories/Repository.ts: Updated getObjects method signature to accept
    union types (T | T[]) for type, status, and priority parameters
  src/repositories/local/LocalRepository.ts: Updated getObjects method to pass
    through new array parameters to core filtering function
  src/repositories/local/getObjects.ts: Modified filtering logic to handle both
    single values and arrays using Array.includes() for membership testing, with
    proper empty array handling
  src/repositories/local/__tests__/getObjects.test.ts: Added comprehensive unit
    tests for multiple value filtering including multiple
    types/statuses/priorities, mixed filters, backward compatibility, and edge
    cases
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
log: []
schema: v1.0
childrenIds:
  - T-add-e2e-tests-for-multiple
  - T-update-service-layer-for
  - T-update-tool-handler-for-array
  - T-update-tool-schema-for
  - T-update-repository-layer-for
created: 2025-08-22T04:21:12.029Z
updated: 2025-08-22T04:21:12.029Z
---

# Multiple Filter Values for List Objects Feature

## Purpose and Functionality

Enhance the `list_issues` MCP tool to support multiple values for type, status, and priority filters, enabling more flexible querying of task trellis objects. For example, users can now filter for both "feature" and "task" types in a single request, or search for objects with "open" and "in-progress" statuses simultaneously.

## Key Components to Implement

### 1. Tool Schema Enhancement

- Update `listObjectsTool.ts` input schema to accept arrays for `type`, `status`, `priority` filters
- Make `type` parameter optional like other filter parameters
- Maintain backward compatibility with single string values
- Update tool description with multiple value examples

### 2. Service Layer Updates

- Modify `handleListObjects` function to handle both single values and arrays
- Convert string/array inputs to appropriate enum arrays
- Update validation logic for multiple enum values
- Enhance error handling for invalid multiple values

### 3. Repository Layer Enhancement

- Update `getObjects` function signature to accept arrays of enums
- Implement multiple value matching logic (OR operation within each filter type)
- Maintain existing single-value filtering behavior
- Optimize filtering performance for multiple values

### 4. Backward Compatibility

- Ensure existing single-value filter calls continue working unchanged
- Support mixed usage (some filters single, others multiple)
- Preserve all existing tool behavior and responses

## Detailed Acceptance Criteria

### Functional Requirements

- **Multiple Type Filtering**: Accept arrays like `["feature", "task"]` to return both features and tasks
- **Multiple Status Filtering**: Accept arrays like `["open", "in-progress"]` to return objects in either status
- **Multiple Priority Filtering**: Accept arrays like `["high", "medium"]` to return high or medium priority objects
- **Optional Type Parameter**: When type is omitted, return all object types that match other filters
- **Combined Multiple Filters**: Support multiple values across different filter types simultaneously
- **Single Value Compatibility**: Existing single string values continue working without changes

### Input/Output Expectations

- **Input**: `{ type: ["feature", "task"], status: "open" }` → Returns all open features and tasks
- **Input**: `{ status: ["open", "in-progress"], priority: ["high"] }` → Returns high priority objects that are open or in-progress (all types)
- **Input**: `{ type: "task" }` → Existing behavior preserved (single task type)
- **Input**: `{}` → Error (at least one filter must be provided)

### Error Handling

- Invalid enum values in arrays should return clear error messages
- Mixed valid/invalid values should identify specific invalid items
- Empty arrays should be treated as filter not provided
- Malformed input should return helpful validation errors

### Data Validation

- All array elements must be valid enum values for their respective filter type
- Single values automatically converted to single-element arrays internally
- Type coercion from strings to appropriate enum types
- Preserve existing enum validation logic

## Implementation Guidance

### Technical Approach

1. **Schema Design**: Use JSON Schema `oneOf` to accept both string and array of strings for each filter
2. **Normalization**: Convert all inputs to arrays internally for consistent processing
3. **Filtering Logic**: Use `Array.includes()` for membership testing against filter arrays
4. **Performance**: Minimize object iteration by applying multiple filters efficiently

### Testing Requirements

#### Unit Tests

- Test multiple value parsing and enum conversion
- Verify backward compatibility with single values
- Test error handling for invalid multiple values
- Validate filtering logic with various combinations
- Test performance with large filter arrays

#### E2E Tests

- Multiple type filtering scenarios (e.g., `["project", "epic"]`)
- Multiple status filtering with different combinations
- Multiple priority filtering validation
- Mixed single/multiple filter usage
- Optional type parameter behavior
- Combined multiple filters across all parameters
- Error cases with invalid enum arrays
- Large dataset filtering performance
- Backward compatibility verification

### Security Considerations

- **Input Validation**: Strict validation of array elements against known enum values
- **Type Safety**: Ensure all filter values are properly typed and validated
- **Resource Protection**: Prevent excessive filtering operations that could impact performance
- **Error Information**: Avoid exposing internal implementation details in error messages

### Performance Requirements

- **Response Time**: Multiple value filtering should not significantly impact response times
- **Memory Usage**: Efficient array processing without excessive memory allocation
- **Scalability**: Handle large numbers of filter values (reasonable limits: max 10 values per filter type)
- **Optimization**: Early filtering to reduce object processing overhead

## Dependencies

None - this is a standalone enhancement to existing filtering infrastructure.

## Integration Points

- MCP tool interface (client-facing API)
- Task Trellis service layer (business logic)
- Local repository implementation (data access)
- Existing enum validation and type conversion utilities

## Implementation Notes

- Prioritize code reuse of existing filtering and validation logic
- Maintain consistency with current error handling patterns
- Follow existing code style and architectural patterns
- Ensure comprehensive test coverage for all new functionality
