---
id: T-update-tool-schema-for
title: Update Tool Schema for Multiple Values and Optional Type
status: open
priority: high
parent: F-multiple-filter-values-for
prerequisites:
  - T-update-service-layer-for
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-22T04:25:50.664Z
updated: 2025-08-22T04:25:50.664Z
---

# Update Tool Schema for Multiple Values and Optional Type

## Context

This task updates the MCP tool schema to accept both single values and arrays for type, status, and priority filters, and makes the type parameter optional to enable querying all object types.

## Specific Implementation Requirements

### 1. Update Tool Schema (`src/tools/listObjectsTool.ts`)

- Remove `type` from the `required` array (line 73)
- Update property definitions to accept both strings and arrays:
  ```typescript
  type: {
    type: ["string", "array"],
    items: { type: "string" },
    description: "Type of issues to list (optional)",
  },
  status: {
    type: ["string", "array"],
    items: { type: "string" },
    description: "Status to filter issues (optional)",
  },
  priority: {
    type: ["string", "array"],
    items: { type: "string" },
    description: "Priority to filter issues (optional)",
  }
  ```

### 2. Update Tool Description

- Add examples of multiple value usage in the description
- Update usage patterns to show array syntax
- Clarify that type is now optional
- Add example: `- List features and tasks: type=['feature', 'task']`
- Add example: `- List all open objects: status='open' (no type filter)`

### 3. Schema Validation Enhancement

- Ensure schema accepts both single strings and string arrays
- Validate that at least one filter parameter is provided when type is optional
- Update parameter validation to handle the new optional type requirement

## Technical Approach

1. Use JSON Schema array syntax to accept both strings and arrays
2. Update tool description with comprehensive examples
3. Remove type from required parameters array
4. Add validation to ensure at least one filter is provided

## Acceptance Criteria

- ✅ Tool schema accepts both single strings and arrays for type, status, priority
- ✅ Type parameter is optional (not in required array)
- ✅ Tool description includes examples of multiple value usage
- ✅ Schema validation works correctly for both input types
- ✅ Backward compatibility maintained for existing single value calls
- ✅ Clear documentation shows the new filtering capabilities

## Testing Requirements

Create unit tests in `src/tools/__tests__/listObjectsTool.test.ts`:

- Test schema accepts string arrays for type, status, priority
- Test schema accepts single strings (backward compatibility)
- Test type parameter is truly optional
- Test mixed single/array parameter combinations
- Test validation with no parameters (should error gracefully)
- Test schema validation rejects invalid array contents

## Dependencies

- T-update-service-layer-for (service layer must handle arrays first)

## Files to Modify

- `src/tools/listObjectsTool.ts`
- `src/tools/__tests__/listObjectsTool.test.ts` (create if doesn't exist)
