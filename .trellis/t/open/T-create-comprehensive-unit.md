---
id: T-create-comprehensive-unit
title: Create comprehensive unit tests for auto-prune functionality
status: open
priority: medium
prerequisites:
  - T-add-auto-prune-cli-argument
  - T-add-repository-method-to
  - T-modify-pruneclosed-function
  - T-integrate-auto-prune-into
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-22T18:24:00.032Z
updated: 2025-08-22T18:24:00.032Z
---

# Create comprehensive unit tests for auto-prune functionality

## Context

Create a dedicated unit test suite for the complete auto-prune feature, ensuring comprehensive coverage of all functionality including CLI parsing, repository enhancements, modified pruneClosed logic, and server integration.

## Implementation Requirements

### Test File Structure

Create or enhance these test files:

- `src/services/local/__tests__/pruneClosed.test.ts` - Core pruning logic tests
- `src/repositories/local/__tests__/LocalRepository.test.ts` - Repository method tests
- `src/__tests__/server.test.ts` - CLI and startup integration tests

### CLI Argument Testing

Test CLI argument parsing and validation:

- Valid numeric inputs (0, 1, 7, 30, 365)
- Invalid inputs (negative numbers, non-numeric strings, decimals)
- Default behavior when option omitted
- Help text generation includes auto-prune option
- Integration with existing CLI options

### Repository Method Testing

Test new child querying functionality:

- Query children of object with multiple children
- Query children of object with no children
- Test includeClosed parameter behavior
- Handle invalid/non-existent parent IDs
- Test with various object types and statuses
- Performance testing with reasonable object counts

### PruneClosed Logic Testing

Test day-based pruning with hierarchical validation:

- Day-based age calculation accuracy (1, 7, 30 days)
- Objects with no children (existing behavior preserved)
- Closed parent with open children (should be skipped)
- Closed parent with closed children (should be deleted)
- Multi-level hierarchies (grandparent → parent → child)
- Mixed scenarios (some objects with/without children)
- Error handling when child queries fail
- Logging output verification

### Server Integration Testing

Test startup sequence integration:

- Startup with auto-prune disabled (autoPrune = 0)
- Startup with auto-prune enabled (autoPrune > 0)
- Startup behavior when auto-prune succeeds
- Startup behavior when auto-prune fails
- Logging output verification
- Mock repository and service for isolated testing

## Technical Approach

1. Use Jest testing framework following existing patterns
2. Create comprehensive test data with object hierarchies
3. Mock dependencies where appropriate for isolation
4. Use existing test utilities from `src/__tests__/e2e/utils`
5. Follow existing test file naming and structure conventions
6. Ensure tests are deterministic and don't interfere with each other

## Acceptance Criteria

- 100% code coverage for all new auto-prune functionality
- All edge cases and error scenarios are tested
- Tests are fast and reliable (no flaky tests)
- Test data setup and teardown is clean
- Mock usage is appropriate and not over-mocked
- Test descriptions are clear and maintainable
- All tests pass consistently in CI environment
- No regression in existing test functionality

## Testing Requirements

Create unit tests covering:

- **CLI Parsing**: All input validation scenarios
- **Repository**: Child querying with various data states
- **Prune Logic**: Hierarchical validation and day calculations
- **Server Integration**: Startup sequence with mocked dependencies
- **Error Handling**: All failure modes and edge cases
- **Performance**: Reasonable execution time for typical datasets

## Files to Create/Modify

- `src/services/local/__tests__/pruneClosed.test.ts`
- `src/repositories/local/__tests__/LocalRepository.test.ts`
- `src/__tests__/server.test.ts`
- Update existing test utilities if needed

## Dependencies

- **Prerequisites**: All implementation tasks (T-add-auto-prune-cli-argument, T-add-repository-method-to, T-modify-pruneclosed-function, T-integrate-auto-prune-into)
- **Uses**: Existing Jest testing framework and utilities

## Security Considerations

- Test input validation prevents injection attacks
- Test that hierarchical validation cannot be bypassed
- Verify error handling doesn't leak sensitive information
