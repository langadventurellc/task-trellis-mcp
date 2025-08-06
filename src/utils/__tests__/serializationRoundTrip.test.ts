import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { deserializeTrellisObject } from "../deserializeTrellisObject";
import { serializeTrellisObject } from "../serializeTrellisObject";

describe("TrellisObject Serialization/Deserialization Integration Tests", () => {
  describe("Round-trip serialization compatibility", () => {
    it("should handle basic TrellisObject round-trip", () => {
      const original: TrellisObject = {
        id: "T-basic-test",
        title: "Basic Test Task",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.MEDIUM,
        prerequisites: ["prereq-1", "prereq-2"],
        affectedFiles: new Map([
          ["src/component.ts", "modified"],
          ["tests/component.test.ts", "created"],
        ]),
        log: ["Initial commit", "Added tests"],
        schema: "v1.0",
        childrenIds: ["child-1"],
        body: "Basic task description",
        type: TrellisObjectType.TASK,
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      const serialized = serializeTrellisObject(original);
      const deserialized = deserializeTrellisObject(serialized);

      expect(deserialized).toEqual(original);
    });

    it("should handle complex multi-line content round-trip", () => {
      const complexBody = `# Complex Task

This task involves multiple steps:

## Prerequisites
- Set up environment
- Install dependencies

## Implementation Steps

1. Create the main component
2. Add unit tests
3. Update documentation

\`\`\`typescript
interface Example {
  name: string;
  value: number;
}
\`\`\`

## Notes

> **Important**: This requires careful attention to detail.

### Edge Cases
- Handle empty inputs
- Validate user permissions
- Graceful error handling

---

Additional section with --- delimiters for testing.`;

      const original: TrellisObject = {
        id: "T-complex-content-test",
        title: 'Complex Content Test with "quotes" and symbols: @#$%',
        status: TrellisObjectStatus.IN_PROGRESS,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: [
          "setup environment",
          'install deps with "quotes"',
          "config: with: colons",
        ],
        affectedFiles: new Map([
          ["src/complex file name.ts", "created"],
          ["docs/README.md", "updated"],
          ["config/settings.json", "modified"],
          ["tests/integration/complex.test.ts", "created"],
        ]),
        log: [
          "Initial implementation",
          "Multi-line commit message:\n- Added feature A\n- Fixed bug B\n- Updated docs",
          "Code review feedback:\n\n> Reviewer comments:\n> - Good implementation\n> - Consider edge cases",
          'Final commit with special chars: "quotes" and symbols @#$%',
        ],
        schema: "v2.1-beta",
        childrenIds: ["subtask-1", "subtask-2", "cleanup-task"],
        body: complexBody,
        type: TrellisObjectType.TASK,
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      const serialized = serializeTrellisObject(original);
      const deserialized = deserializeTrellisObject(serialized);

      expect(deserialized).toEqual(original);
    });

    it("should handle empty collections round-trip", () => {
      const original: TrellisObject = {
        id: "T-empty-collections-test",
        title: "Empty Collections Test",
        status: TrellisObjectStatus.DRAFT,
        priority: TrellisObjectPriority.LOW,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: "",
        type: TrellisObjectType.TASK,
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      const serialized = serializeTrellisObject(original);
      const deserialized = deserializeTrellisObject(serialized);

      expect(deserialized).toEqual(original);
    });

    it("should handle special characters and unicode round-trip", () => {
      const original: TrellisObject = {
        id: "T-unicode-test-🚀",
        title: "Unicode Test: 你好世界 🌍 émojis & spëcial chars",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.MEDIUM,
        prerequisites: [
          "Setup with émojis 🔧",
          "Config files: ~/.bashrc",
          'Path with spaces and "quotes"',
        ],
        affectedFiles: new Map([
          ["src/émoji-component.ts", "créated"],
          ["docs/中文文档.md", "updated"],
          ["files/with spaces & symbols.json", "modified"],
        ]),
        log: [
          "Added unicode support 🎉",
          "Fixed encoding issues:\n- UTF-8 properly handled\n- Special chars: àáâãäåæç",
          "Emoji support: 😀😃😄😁😆😅🤣😂",
        ],
        schema: "v1.0",
        childrenIds: ["子任务-1", "tâche-2"],
        body: `# Unicode Support Test

This task tests unicode and special character handling.

## Examples:
- Chinese: 你好世界
- French: Bonjour le monde
- Spanish: Hola mundo  
- Emojis: 🚀🌟💫⭐🎯

### Code Example:
\`\`\`javascript
const greeting = "Hello 世界! 🌍";
console.log(greeting);
\`\`\`

> Note: All unicode characters should be preserved.`,
        type: TrellisObjectType.TASK,
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      const serialized = serializeTrellisObject(original);
      const deserialized = deserializeTrellisObject(serialized);

      expect(deserialized).toEqual(original);
    });

    it("should handle body content with YAML-like structure round-trip", () => {
      const yamlLikeBody = `# Task with YAML-like content

This task contains content that might confuse the parser:

\`\`\`yaml
---
config:
  name: example
  values:
    - item1
    - item2
---
\`\`\`

## Configuration Example

\`\`\`
key: value
list:
  - first
  - second
nested:
  deep:
    property: "value with --- markers"
\`\`\`

---

This section starts with --- which could be problematic.

### More content after ---

The parser should handle all of this correctly.`;

      const original: TrellisObject = {
        id: "T-yaml-body-test",
        title: "YAML Body Content Test",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: ["yaml-parser-setup"],
        affectedFiles: new Map([["config/app.yaml", "created"]]),
        log: ["Added YAML config support"],
        schema: "v1.0",
        childrenIds: [],
        body: yamlLikeBody,
        type: TrellisObjectType.TASK,
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      const serialized = serializeTrellisObject(original);
      const deserialized = deserializeTrellisObject(serialized);

      expect(deserialized).toEqual(original);
    });

    it("should handle very large content round-trip", () => {
      // Create large arrays and content to test performance and memory handling
      const largePrerequistes = Array.from(
        { length: 100 },
        (_, i) => `prerequisite-${i}`,
      );
      const largeLog = Array.from(
        { length: 50 },
        (_, i) =>
          `Log entry ${i}:\nThis is a multi-line log entry\nwith detailed information\nabout step ${i}`,
      );
      const largeChildrenIds = Array.from(
        { length: 200 },
        (_, i) => `child-task-${i}`,
      );

      const largeAffectedFiles = new Map<string, string>();
      for (let i = 0; i < 150; i++) {
        largeAffectedFiles.set(
          `src/component-${i}.ts`,
          i % 3 === 0 ? "created" : i % 3 === 1 ? "modified" : "deleted",
        );
      }

      const largeBody = `# Large Content Test

${"This is a large body content section that repeats many times. ".repeat(500)}

## Large Section

${"Another section with repeated content for testing serialization performance. ".repeat(300)}

### Code Blocks

\`\`\`typescript
${Array.from({ length: 50 }, (_, i) => `const variable${i} = "value${i}";`).join("\n")}
\`\`\`

## Final Notes

${"Final section content repeated multiple times to test large content handling. ".repeat(200)}`;

      const original: TrellisObject = {
        id: "T-large-content-test",
        title: "Large Content Performance Test",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.LOW,
        prerequisites: largePrerequistes,
        affectedFiles: largeAffectedFiles,
        log: largeLog,
        schema: "v1.0",
        childrenIds: largeChildrenIds,
        body: largeBody,
        type: TrellisObjectType.TASK,
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      const serialized = serializeTrellisObject(original);
      const deserialized = deserializeTrellisObject(serialized);

      expect(deserialized).toEqual(original);
    });

    it("should maintain Map order and exact string content", () => {
      const original: TrellisObject = {
        id: "T-map-order-test",
        title: "Map Order Preservation Test",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.MEDIUM,
        prerequisites: ["first-prereq", "second-prereq", "third-prereq"],
        affectedFiles: new Map([
          ["z-last-file.ts", "created"],
          ["a-first-file.ts", "modified"],
          ["m-middle-file.ts", "deleted"],
          ["1-numeric-start.ts", "created"],
          ["special@file#name.ts", "modified"],
        ]),
        log: [
          "First log entry",
          "Second log with\nmultiple\nlines",
          "Third log entry",
        ],
        schema: "v1.0",
        childrenIds: ["z-child", "a-child", "m-child"],
        body: "Test body content",
        type: TrellisObjectType.TASK,
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      const serialized = serializeTrellisObject(original);
      const deserialized = deserializeTrellisObject(serialized);

      // Check that the Map maintains the same entries
      expect(deserialized.affectedFiles.size).toBe(original.affectedFiles.size);

      // Check each entry individually
      for (const [key, value] of original.affectedFiles) {
        expect(deserialized.affectedFiles.get(key)).toBe(value);
      }

      // Verify complete equality
      expect(deserialized).toEqual(original);
    });
  });

  describe("Serialization format validation", () => {
    it("should produce valid YAML frontmatter structure", () => {
      const original: TrellisObject = {
        id: "F-format-test",
        title: "Format Validation Test",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: ["test-setup"],
        affectedFiles: new Map([["test.ts", "created"]]),
        log: ["Format test"],
        schema: "v1.0",
        childrenIds: ["format-child"],
        body: "Format validation body",
        type: TrellisObjectType.FEATURE,
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      const serialized = serializeTrellisObject(original);

      // Check overall structure
      expect(serialized).toMatch(
        /^---\n[\s\S]+\n---\n\nFormat validation body$/,
      );

      // Verify it can be deserialized
      const deserialized = deserializeTrellisObject(serialized);
      expect(deserialized).toEqual(original);
    });

    it("should handle edge case: body starting with ---", () => {
      const original: TrellisObject = {
        id: "E-edge-case-test",
        title: "Edge Case Test",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.MEDIUM,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: "---\nThis body starts with --- which is tricky\n---\nAnd has more --- markers",
        type: TrellisObjectType.EPIC,
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      const serialized = serializeTrellisObject(original);
      const deserialized = deserializeTrellisObject(serialized);

      expect(deserialized).toEqual(original);
    });
  });

  describe("Cross-validation with multiple objects", () => {
    it("should handle multiple different objects in sequence", () => {
      const objects: TrellisObject[] = [
        {
          id: "T-seq-1",
          title: "First Object",
          status: TrellisObjectStatus.DONE,
          priority: TrellisObjectPriority.LOW,
          prerequisites: [],
          affectedFiles: new Map([["file1.ts", "created"]]),
          log: ["First object log"],
          schema: "v1.0",
          childrenIds: [],
          body: "First body",
          type: TrellisObjectType.TASK,
          created: "2025-01-15T10:00:00Z",
          updated: "2025-01-15T10:00:00Z",
        },
        {
          id: "P-seq-2",
          title: "Second Object",
          status: TrellisObjectStatus.IN_PROGRESS,
          priority: TrellisObjectPriority.HIGH,
          prerequisites: ["T-seq-1"],
          affectedFiles: new Map([
            ["file1.ts", "modified"],
            ["file2.ts", "created"],
          ]),
          log: [
            "Started second object",
            "Multi-line log:\nwith details\nand more info",
          ],
          schema: "v2.0",
          childrenIds: ["seq-2-child"],
          body: "# Second Object\n\nMore complex content.",
          type: TrellisObjectType.PROJECT,
          created: "2025-01-15T10:00:00Z",
          updated: "2025-01-15T10:00:00Z",
        },
        {
          id: "F-seq-3",
          title: 'Third Object with "quotes"',
          status: TrellisObjectStatus.OPEN,
          priority: TrellisObjectPriority.MEDIUM,
          prerequisites: ["T-seq-1", "P-seq-2"],
          affectedFiles: new Map(),
          log: [],
          schema: "v1.5",
          childrenIds: ["seq-3a", "seq-3b"],
          body: "",
          type: TrellisObjectType.FEATURE,
          created: "2025-01-15T10:00:00Z",
          updated: "2025-01-15T10:00:00Z",
        },
      ];

      // Serialize all objects
      const serializedObjects = objects.map((obj) =>
        serializeTrellisObject(obj),
      );

      // Deserialize all objects
      const deserializedObjects = serializedObjects.map((str) =>
        deserializeTrellisObject(str),
      );

      // Verify each object matches the original
      deserializedObjects.forEach((deserialized, index) => {
        expect(deserialized).toEqual(objects[index]);
      });
    });
  });
});
