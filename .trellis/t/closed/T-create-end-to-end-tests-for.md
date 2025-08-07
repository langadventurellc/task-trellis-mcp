---
id: T-create-end-to-end-tests-for
title: Create end-to-end tests for replaceObjectBodyRegex tool
status: done
priority: medium
prerequisites: []
affectedFiles:
  src/__tests__/e2e/crud/replaceObjectBodyRegex.e2e.test.ts:
    Created comprehensive
    e2e test suite with 25 test cases covering all tool functionality, error
    conditions, and integration scenarios
  src/__tests__/e2e/utils/parseReplaceObjectBodyRegexResponse.ts:
    Created response parser utility for replaceObjectBodyRegex tool responses
    with robust handling of patterns containing quotes
  src/__tests__/e2e/utils/index.ts: Added export for parseReplaceObjectBodyRegexResponse utility function
log:
  - >-
    Successfully created comprehensive end-to-end tests for the
    replaceObjectBodyRegex tool following established project patterns. The test
    suite includes 25 test cases covering:


    **Basic Functionality:** Simple text replacement, backreferences, multiline
    content, and different object types

    **Regex Features:** Case sensitivity, word boundaries, anchors, quantifiers,
    and character classes  

    **Multiple Occurrences:** Default single-match enforcement and
    allowMultipleOccurrences option

    **Error Handling:** Non-existent objects, empty bodies, invalid regex, large
    content, special characters

    **File System Persistence:** YAML frontmatter preservation and hierarchy
    path verification

    **Integration Scenarios:** Complex markdown, template replacements, and
    cross-references


    All tests pass and follow existing e2e testing patterns using
    TestEnvironment, McpTestClient, and established utilities. Added custom
    parseReplaceObjectBodyRegexResponse helper function with robust parsing to
    handle patterns containing quotes.
schema: v1.0
childrenIds: []
created: 2025-08-07T02:23:47.263Z
updated: 2025-08-07T02:23:47.263Z
---

# Create end-to-end tests for replaceObjectBodyRegex tool

## Context

The `replace_object_body_regex` tool was recently added to the Task Trellis MCP server to enable targeted regex-based text replacement within Trellis object bodies. This tool provides a safer alternative to wholesale body replacement by allowing surgical edits to specific text patterns.

**Related Implementation Files:**

- `src/tools/replaceObjectBodyRegexTool.ts` - Main tool implementation
- `src/tools/__tests__/replaceObjectBodyRegexTool.test.ts` - Unit tests (already complete)
- `src/utils/replaceStringWithRegex.ts` - Underlying utility function
- `src/__tests__/e2e/crud/` - Location for new e2e tests (follow existing patterns)

## Objective

Create comprehensive end-to-end tests for the `replace_object_body_regex` tool following the established e2e testing patterns in the project. The tests should verify the tool works correctly through the MCP server interface with real file system operations and validate all edge cases and error conditions.

## Technical Approach

### File Structure

- Create: `src/__tests__/e2e/crud/replaceObjectBodyRegex.e2e.test.ts`
- Follow the same structure as existing e2e CRUD tests (e.g., `updateObject.e2e.test.ts`)
- Use existing e2e test utilities from `../utils`

### Required Test Framework Components

- `TestEnvironment` - Clean test environment setup/teardown
- `McpTestClient` - MCP server communication
- `createObjectFile()` - Create test objects with body content
- `readObjectFile()` - Verify file system persistence after operations
- Helper functions for parsing tool responses

### Test Categories

#### 1. Basic Functionality Tests

- **Simple text replacement**: Replace simple strings within object bodies
- **Regex pattern matching**: Use basic regex patterns (e.g., `\\d+`, `\\w+`)
- **Backreference replacement**: Test `$1`, `$2` style replacements with capture groups
- **Multiline content**: Verify regex works across line boundaries
- **Multiple object types**: Test with projects, epics, features, and tasks

#### 2. Regex Feature Tests

- **Case-sensitive matching**: Default behavior
- **Case-insensitive patterns**: Complex regex patterns
- **Word boundaries**: `\\b` patterns for precise matching
- **Anchored patterns**: `^` and `$` for line/string anchors
- **Quantifiers**: `+`, `*`, `?`, `{n,m}` patterns
- **Character classes**: `[a-zA-Z]`, `[^\\s]` patterns

#### 3. Multiple Occurrences Handling

- **Default single match**: Verify tool rejects multiple matches by default
- **Allow multiple occurrences**: Test `allowMultipleOccurrences: true` parameter
- **Multiple matches error**: Verify clear error when multiple matches found
- **No matches**: Handle gracefully when regex doesn't match anything

#### 4. Error Handling & Edge Cases

- **Non-existent object ID**: Proper error response
- **Empty body content**: Handle objects with no body gracefully
- **Invalid regex patterns**: Catch malformed regex syntax
- **Large body content**: Test with substantial text (10KB+)
- **Special characters**: Unicode, HTML entities, markdown syntax
- **Null/undefined parameters**: Missing required parameters

#### 5. File System Persistence

- **Verify changes persist**: Read files after updates to confirm changes saved
- **Object hierarchy paths**: Test objects in different hierarchy locations
- **YAML frontmatter preservation**: Ensure metadata unchanged
- **Body content accuracy**: Exact match of replaced content in files

#### 6. Integration Scenarios

- **Complex markdown content**: Code blocks, tables, lists
- **Mixed content types**: YAML, JSON, code within body text
- **Cross-references**: Object IDs and links within body content
- **Template replacements**: Replace placeholder patterns with actual values

### Sample Test Cases

```typescript
describe("Basic Regex Replacements", () => {
  it("should replace simple text patterns", async () => {
    // Create task with body: "Hello World, welcome to the system"
    // Replace "World" with "Universe"
    // Verify: "Hello Universe, welcome to the system"
  });

  it("should use backreferences for pattern reordering", async () => {
    // Body: "Name: John Doe"
    // Regex: "Name: (\\w+) (\\w+)", Replacement: "Name: $2, $1"
    // Verify: "Name: Doe, John"
  });
});

describe("Multiple Occurrences", () => {
  it("should reject multiple matches by default", async () => {
    // Body with multiple "TODO" items
    // Attempt to replace "TODO" -> should error
  });

  it("should replace all when allowMultipleOccurrences is true", async () => {
    // Same body, set allowMultipleOccurrences: true
    // Should replace all "TODO" instances
  });
});
```

## Acceptance Criteria

### Functional Requirements

- ✅ **Complete test coverage**: All tool parameters and edge cases covered
- ✅ **Follows e2e patterns**: Uses same structure as existing CRUD e2e tests
- ✅ **Real MCP integration**: Tests actual server tool calls, not mocked units
- ✅ **File system validation**: Verifies persistence to `.trellis` markdown files
- ✅ **Comprehensive scenarios**: At least 15+ distinct test cases across categories
- ✅ **Error condition coverage**: Tests all expected error responses

### Quality Requirements

- ✅ **Test execution time**: All tests complete within 30 seconds
- ✅ **Clean test isolation**: Each test creates/cleans up its own objects
- ✅ **Clear test descriptions**: Self-documenting test case names and assertions
- ✅ **Consistent assertions**: Uses same assertion patterns as existing e2e tests
- ✅ **No test flakiness**: Reliable execution across different environments

### Integration Requirements

- ✅ **MCP server activation**: Properly activates local mode in beforeEach
- ✅ **Environment management**: Uses TestEnvironment for clean test runs
- ✅ **Response parsing**: Correctly parses and validates tool responses
- ✅ **File path handling**: Works with all object hierarchy file locations

## Implementation Notes

### Key Patterns to Follow

- Use `parseReplaceObjectBodyRegexResponse()` helper (create if needed)
- Test both successful and error responses with proper `content[0].text` parsing
- Create meaningful test object bodies that demonstrate the replacement clearly
- Include both simple and complex regex patterns to validate full capability

### Test Data Strategy

- **Rich content examples**: Use realistic markdown with headers, lists, code blocks
- **Edge case content**: Empty strings, very long content, special characters
- **Pattern examples**: Common use cases like find/replace variable names, update versions, fix typos

### Dependencies

- Requires existing e2e test infrastructure (TestEnvironment, McpTestClient)
- May need to create helper function `parseReplaceObjectBodyRegexResponse()` following existing patterns
- Leverages `MultipleMatchesError` for error scenario testing

## Testing Strategy

Run tests with:

```bash
npm test -- --testPathPatterns=replaceObjectBodyRegex.e2e.test
```

Ensure integration with full test suite:

```bash
npm test
```

This task is sized for 2 hours of focused implementation, creating comprehensive e2e test coverage for the new tool while following established project patterns and quality standards.
