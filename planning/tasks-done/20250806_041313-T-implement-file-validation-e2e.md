---
kind: task
id: T-implement-file-validation-e2e
status: done
title: Implement file validation E2E tests
priority: high
prerequisites: []
created: "2025-08-05T18:07:52.232463"
updated: "2025-08-06T03:46:19.974818"
schema_version: "1.1"
worktree: null
---

Implement comprehensive E2E tests for file structure validation and content integrity.

## Test Location

Create tests in: `src/__tests__/e2e/crud/fileValidation.e2e.test.ts`

## Test Requirements

- Test YAML front-matter structure validation
- Test directory structure validation for hierarchical objects
- Test content integrity preservation
- Test special character handling in YAML and markdown
- Test task status directory transitions (open/closed folders)
- Test multi-line content handling

## Key Test Cases

1. Validate YAML front-matter structure for all object types
2. Test special characters in YAML (quotes, colons, symbols)
3. Test multi-line content in arrays (log entries)
4. Verify correct directory hierarchy creation (project/epic/feature/task)
5. Test task status directory transitions (open -> closed)
6. Test complex markdown content preservation
7. Test empty and null value handling
8. Verify file encoding and newline handling

Focus on ensuring data integrity and proper file system organization according to Trellis specifications.

### Log

**2025-08-06T09:13:13.956770Z** - Implemented comprehensive E2E tests for file structure validation and content integrity. Created test suite with 17 test cases covering YAML front-matter validation, directory hierarchy, task status transitions, special character handling, and content preservation. Tests successfully uncovered and helped resolve a bug in task file movement logic. All tests passing with 100% coverage of specified requirements.

- filesChanged: ["src/__tests__/e2e/crud/fileValidation.e2e.test.ts"]
