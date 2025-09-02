import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { deserializeTrellisObject } from "../deserializeTrellisObject";
import { serializeTrellisObject } from "../serializeTrellisObject";

describe("deserializeTrellisObject", () => {
  it("should deserialize a basic markdown string with YAML frontmatter", () => {
    const markdownString = `---
id: T-test-id-123
title: Test Task
status: in-progress
priority: high
parent: F-parent-feature-456
prerequisites:
  - prereq-1
  - prereq-2
affectedFiles:
  src/file1.ts: modified
  src/file2.ts: created
log:
  - Initial commit
  - Updated implementation
schema: v1.0
childrenIds:
  - child-1
  - child-2
created: "2025-01-15T10:00:00Z"
updated: "2025-01-15T10:00:00Z"
---

This is the main content of the task.`;

    const result = deserializeTrellisObject(markdownString);

    expect(result).toEqual({
      id: "T-test-id-123",
      type: TrellisObjectType.TASK,
      title: "Test Task",
      status: TrellisObjectStatus.IN_PROGRESS,
      priority: TrellisObjectPriority.HIGH,
      parent: "F-parent-feature-456",
      prerequisites: ["prereq-1", "prereq-2"],
      affectedFiles: new Map([
        ["src/file1.ts", "modified"],
        ["src/file2.ts", "created"],
      ]),
      log: ["Initial commit", "Updated implementation"],
      schema: "v1.0",
      childrenIds: ["child-1", "child-2"],
      body: "This is the main content of the task.",
      created: "2025-01-15T10:00:00Z",
      updated: "2025-01-15T10:00:00Z",
    });
  });

  it("should handle multi-line log entries correctly", () => {
    const markdownString = `---
id: T-multiline-test
title: Multi-line Log Test
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log:
  - Single line entry
  - |-
    Multi-line entry:
    This spans multiple lines
    With various details
    And even more information
  - Another single line
  - |-
    Complex multi-line:
    - Bullet point 1
    - Bullet point 2
      - Nested point
    - Final point
schema: v1.0
childrenIds: []
created: "2025-01-15T10:00:00Z"
updated: "2025-01-15T10:00:00Z"
---

Test body content`;

    const result = deserializeTrellisObject(markdownString);

    expect(result.log).toHaveLength(4);
    expect(result.log[0]).toBe("Single line entry");
    expect(result.log[1]).toBe(
      "Multi-line entry:\nThis spans multiple lines\nWith various details\nAnd even more information",
    );
    expect(result.log[2]).toBe("Another single line");
    expect(result.log[3]).toBe(
      "Complex multi-line:\n- Bullet point 1\n- Bullet point 2\n  - Nested point\n- Final point",
    );
  });

  it("should handle empty arrays and objects correctly", () => {
    const markdownString = `---
id: T-empty-test
title: Empty Collections Test
status: draft
priority: low
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: "2025-01-15T10:00:00Z"
updated: "2025-01-15T10:00:00Z"
---

`;

    const result = deserializeTrellisObject(markdownString);

    expect(result.prerequisites).toEqual([]);
    expect(result.affectedFiles).toEqual(new Map());
    expect(result.log).toEqual([]);
    expect(result.childrenIds).toEqual([]);
    expect(result.body).toBe("");
  });

  it("should handle special characters in strings", () => {
    const markdownString = `---
id: T-special-chars-test
title: 'Title with "quotes" and symbols: @#$%'
status: in-progress
priority: high
prerequisites:
  - prereq with spaces
  - prereq-with-dashes
affectedFiles:
  'src/file with spaces.ts': 'status with "quotes"'
  'src/file-with-dashes.ts': 'status: with: colons'
log:
  - 'Log entry with "double quotes"'
  - "Log entry with 'single quotes'"
  - 'Log entry with: colons and @symbols'
schema: v2.0-beta
childrenIds:
  - child-with-dashes
  - child with spaces
created: "2025-01-15T10:00:00Z"
updated: "2025-01-15T10:00:00Z"
---

Body with "quotes", symbols: @#$%, and other special characters!`;

    const result = deserializeTrellisObject(markdownString);

    expect(result.title).toBe('Title with "quotes" and symbols: @#$%');
    expect(result.affectedFiles.get("src/file with spaces.ts")).toBe(
      'status with "quotes"',
    );
    expect(result.log[0]).toBe('Log entry with "double quotes"');
    expect(result.body).toBe(
      'Body with "quotes", symbols: @#$%, and other special characters!',
    );
  });

  it("should throw error for invalid format without frontmatter delimiters", () => {
    const invalidString = `id: test
title: Test
body content`;

    expect(() => deserializeTrellisObject(invalidString)).toThrow(
      "Invalid format: Expected YAML frontmatter delimited by --- markers",
    );
  });

  it("should throw error for invalid YAML syntax", () => {
    const invalidYamlString = `---
id: test
title: Test
invalid: [unclosed array
---

body content`;

    expect(() => deserializeTrellisObject(invalidYamlString)).toThrow(
      /Invalid YAML frontmatter:/,
    );
  });

  it("should throw error for missing required fields", () => {
    const missingFieldString = `---
id: test
title: Test Task
status: open
# priority is missing
schema: v1.0
created: "2025-01-15T10:00:00Z"
updated: "2025-01-15T10:00:00Z"
---

body content`;

    expect(() => deserializeTrellisObject(missingFieldString)).toThrow(
      "Missing required field: priority",
    );
  });

  it("should throw error for invalid field types", () => {
    const invalidTypeString = `---
id: test
title: Test Task
status: open
priority: 123  # should be string, not number
schema: v1.0
created: "2025-01-15T10:00:00Z"
updated: "2025-01-15T10:00:00Z"
---

body content`;

    expect(() => deserializeTrellisObject(invalidTypeString)).toThrow(
      "Invalid type for field priority: Expected string",
    );
  });

  it("should handle non-string values in arrays by filtering them out", () => {
    const mixedArrayString = `---
id: T-test
title: Test Task
status: open
priority: high
prerequisites:
  - valid string
  - 123
  - another string
  - true
  - null
log:
  - valid log entry
  - 456
  - another valid entry
schema: v1.0
childrenIds:
  - valid-child
  - 789
created: "2025-01-15T10:00:00Z"
updated: "2025-01-15T10:00:00Z"
---

body content`;

    const result = deserializeTrellisObject(mixedArrayString);

    expect(result.prerequisites).toEqual(["valid string", "another string"]);
    expect(result.log).toEqual(["valid log entry", "another valid entry"]);
    expect(result.childrenIds).toEqual(["valid-child"]);
  });

  it("should handle non-string values in affectedFiles by filtering them out", () => {
    const mixedObjectString = `---
id: T-test
title: Test Task
status: open
priority: high
prerequisites: []
affectedFiles:
  'valid-file.ts': modified
  'another-file.js': created
  'invalid-number': 123
  'invalid-boolean': true
log: []
schema: v1.0
childrenIds: []
created: "2025-01-15T10:00:00Z"
updated: "2025-01-15T10:00:00Z"
---

body content`;

    const result = deserializeTrellisObject(mixedObjectString);

    expect(result.affectedFiles.size).toBe(2);
    expect(result.affectedFiles.get("valid-file.ts")).toBe("modified");
    expect(result.affectedFiles.get("another-file.js")).toBe("created");
    expect(result.affectedFiles.has("invalid-number")).toBe(false);
    expect(result.affectedFiles.has("invalid-boolean")).toBe(false);
  });

  it("should handle complex markdown body content", () => {
    const complexBodyString = `---
id: T-complex-body-test
title: Complex Body Test
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: "2025-01-15T10:00:00Z"
updated: "2025-01-15T10:00:00Z"
---

# Main Task Description

This is a detailed description of the task.

## Steps to Complete

1. First step
2. Second step
3. Final step

> Important note about the implementation

\`\`\`typescript
const example = "code block";
\`\`\`

### Additional Notes

- Bullet point 1
- Bullet point 2
  - Nested point
- Final point`;

    const result = deserializeTrellisObject(complexBodyString);

    expect(result.body).toContain("# Main Task Description");
    expect(result.body).toContain("## Steps to Complete");
    expect(result.body).toContain("```typescript");
    expect(result.body).toContain("- Bullet point 1");
  });

  it("should perform round-trip serialization/deserialization correctly", () => {
    const originalObject: TrellisObject = {
      id: "T-round-trip-test",
      title: "Round Trip Test",
      status: TrellisObjectStatus.IN_PROGRESS,
      priority: TrellisObjectPriority.HIGH,
      parent: "F-parent-feature-789",
      prerequisites: ["prereq-1", "prereq-2"],
      affectedFiles: new Map([
        ["src/file1.ts", "modified"],
        ["src/file2.ts", "created"],
        ["config/settings.json", "deleted"],
      ]),
      log: [
        "Initial implementation",
        "Multi-line log entry:\nWith multiple lines\nAnd details",
        "Final commit",
      ],
      schema: "v1.0",
      childrenIds: ["child-1", "child-2"],
      body: "# Task Description\n\nThis is the task body with **markdown** formatting.",
      type: TrellisObjectType.TASK,
      created: "2025-01-15T10:00:00Z",
      updated: "2025-01-15T10:00:00Z",
    };

    // Serialize then deserialize
    const serialized = serializeTrellisObject(originalObject);
    const deserialized = deserializeTrellisObject(serialized);

    // Should be identical
    expect(deserialized).toEqual(originalObject);
  });

  it("should handle frontmatter that is not an object", () => {
    const nonObjectString = `---
"just a string"
---

body content`;

    expect(() => deserializeTrellisObject(nonObjectString)).toThrow(
      "Invalid frontmatter: Expected an object",
    );
  });

  it("should handle body content with --- markers", () => {
    const bodyWithDelimitersString = `---
id: T-delim-test
title: Delimiter Test
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: "2025-01-15T10:00:00Z"
updated: "2025-01-15T10:00:00Z"
---

This body contains --- markers
and should handle them correctly.

---

Even multiple --- sections should work.`;

    const result = deserializeTrellisObject(bodyWithDelimitersString);

    expect(result.body).toBe(`This body contains --- markers
and should handle them correctly.

---

Even multiple --- sections should work.`);
  });

  it("should handle markdown without parent field", () => {
    const markdownString = `---
id: P-no-parent-test
title: No Parent Test
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: "2025-01-15T10:00:00Z"
updated: "2025-01-15T10:00:00Z"
---

Test body content`;

    const result = deserializeTrellisObject(markdownString);

    expect(result.parent).toBeUndefined();
    expect(result.id).toBe("P-no-parent-test");
    expect(result.title).toBe("No Parent Test");
  });

  it("should handle markdown with parent set to 'none'", () => {
    const markdownString = `---
id: P-none-parent-test
title: None Parent Test
status: open
priority: medium
parent: none
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: "2025-01-15T10:00:00Z"
updated: "2025-01-15T10:00:00Z"
---

Test body content with parent set to 'none'`;

    const result = deserializeTrellisObject(markdownString);

    expect(result.parent).toBeUndefined();
    expect(result.id).toBe("P-none-parent-test");
    expect(result.title).toBe("None Parent Test");
  });
});
