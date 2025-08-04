import { parse } from "yaml";
import { serializeTrellisObject } from "../serializeTrellisObject";
import { TrellisObject } from "../TrellisObject";
import { TrellisObjectType } from "../TrellisObjectType";
import { TrellisObjectStatus } from "../TrellisObjectStatus";
import { TrellisObjectPriority } from "../TrellisObjectPriority";

describe("serializeTrellisObject", () => {
  it("should serialize a basic TrellisObject to markdown with YAML frontmatter", () => {
    const trellisObject: TrellisObject = {
      id: "test-id-123",
      title: "Test Task",
      status: TrellisObjectStatus.IN_PROGRESS,
      priority: TrellisObjectPriority.HIGH,
      prerequisites: ["prereq-1", "prereq-2"],
      affectedFiles: new Map([
        ["src/file1.ts", "modified"],
        ["src/file2.ts", "created"],
      ]),
      log: ["Initial commit", "Updated implementation"],
      schema: "v1.0",
      childrenIds: ["child-1", "child-2"],
      body: "This is the main content of the task.",
      type: TrellisObjectType.PROJECT,
    };

    const result = serializeTrellisObject(trellisObject);

    // Check that it starts and ends correctly
    expect(result).toMatch(/^---\n/);
    expect(result).toMatch(/\n---\n\nThis is the main content of the task\.$/);

    // Parse the YAML frontmatter to verify structure
    const yamlPart = result.split("---\n")[1];
    const parsedYaml = parse(yamlPart);

    expect(parsedYaml).toEqual({
      id: "test-id-123",
      title: "Test Task",
      status: TrellisObjectStatus.IN_PROGRESS,
      priority: TrellisObjectPriority.HIGH,
      prerequisites: ["prereq-1", "prereq-2"],
      affectedFiles: {
        "src/file1.ts": "modified",
        "src/file2.ts": "created",
      },
      log: ["Initial commit", "Updated implementation"],
      schema: "v1.0",
      childrenIds: ["child-1", "child-2"],
    });
  });

  it("should handle multi-line log entries correctly", () => {
    const trellisObject: TrellisObject = {
      id: "multiline-test",
      title: "Multi-line Log Test",
      status: TrellisObjectStatus.OPEN,
      priority: TrellisObjectPriority.MEDIUM,
      prerequisites: [],
      affectedFiles: new Map(),
      log: [
        "Single line entry",
        "Multi-line entry:\nThis spans multiple lines\nWith various details\nAnd even more information",
        "Another single line",
        "Complex multi-line:\n- Bullet point 1\n- Bullet point 2\n  - Nested point\n- Final point",
      ],
      schema: "v1.0",
      childrenIds: [],
      body: "Test body content",
      type: TrellisObjectType.PROJECT,
    };

    const result = serializeTrellisObject(trellisObject);

    // Parse the YAML frontmatter
    const yamlPart = result.split("---\n")[1];
    const parsedYaml = parse(yamlPart);

    // Verify that multi-line log entries are preserved correctly
    expect(parsedYaml.log).toHaveLength(4);
    expect(parsedYaml.log[0]).toBe("Single line entry");
    expect(parsedYaml.log[1]).toBe(
      "Multi-line entry:\nThis spans multiple lines\nWith various details\nAnd even more information",
    );
    expect(parsedYaml.log[2]).toBe("Another single line");
    expect(parsedYaml.log[3]).toBe(
      "Complex multi-line:\n- Bullet point 1\n- Bullet point 2\n  - Nested point\n- Final point",
    );

    // Verify the structure is still valid YAML
    expect(() => parse(yamlPart)).not.toThrow();
  });

  it("should handle empty arrays and Map correctly", () => {
    const trellisObject: TrellisObject = {
      id: "empty-test",
      title: "Empty Collections Test",
      status: TrellisObjectStatus.DRAFT,
      priority: TrellisObjectPriority.LOW,
      prerequisites: [],
      affectedFiles: new Map(),
      log: [],
      schema: "v1.0",
      childrenIds: [],
      body: "",
      type: TrellisObjectType.PROJECT,
    };

    const result = serializeTrellisObject(trellisObject);
    const yamlPart = result.split("---\n")[1];
    const parsedYaml = parse(yamlPart);

    expect(parsedYaml.prerequisites).toEqual([]);
    expect(parsedYaml.affectedFiles).toEqual({});
    expect(parsedYaml.log).toEqual([]);
    expect(parsedYaml.childrenIds).toEqual([]);
  });

  it("should handle special characters in strings", () => {
    const trellisObject: TrellisObject = {
      id: "special-chars-test",
      title: 'Title with "quotes" and symbols: @#$%',
      status: TrellisObjectStatus.IN_PROGRESS,
      priority: TrellisObjectPriority.HIGH,
      prerequisites: ["prereq with spaces", "prereq-with-dashes"],
      affectedFiles: new Map([
        ["src/file with spaces.ts", 'status with "quotes"'],
        ["src/file-with-dashes.ts", "status: with: colons"],
      ]),
      log: [
        'Log entry with "double quotes"',
        "Log entry with 'single quotes'",
        "Log entry with: colons and @symbols",
      ],
      schema: "v2.0-beta",
      childrenIds: ["child-with-dashes", "child with spaces"],
      body: 'Body with "quotes", symbols: @#$%, and other special characters!',
      type: TrellisObjectType.PROJECT,
    };

    const result = serializeTrellisObject(trellisObject);
    const yamlPart = result.split("---\n")[1];

    // Should parse without errors
    expect(() => parse(yamlPart)).not.toThrow();

    const parsedYaml = parse(yamlPart);
    expect(parsedYaml.title).toBe('Title with "quotes" and symbols: @#$%');
    expect(parsedYaml.affectedFiles["src/file with spaces.ts"]).toBe(
      'status with "quotes"',
    );
    expect(parsedYaml.log[0]).toBe('Log entry with "double quotes"');
  });

  it("should preserve the body content separately from frontmatter", () => {
    const bodyContent = `# Main Task Description

    This is a detailed description of the task.
    
    ## Steps to Complete
    
    1. First step
    2. Second step
    3. Final step
    
    > Important note about the implementation`;

    const trellisObject: TrellisObject = {
      id: "body-test",
      title: "Body Content Test",
      status: TrellisObjectStatus.OPEN,
      priority: TrellisObjectPriority.MEDIUM,
      prerequisites: [],
      affectedFiles: new Map(),
      log: [],
      schema: "v1.0",
      childrenIds: [],
      body: bodyContent,
      type: TrellisObjectType.PROJECT,
    };

    const result = serializeTrellisObject(trellisObject);

    // Check that body is not in the YAML frontmatter
    const yamlPart = result.split("---\n")[1];
    const parsedYaml = parse(yamlPart);
    expect(parsedYaml.body).toBeUndefined();

    // Check that body appears after the frontmatter
    const bodyPart = result.split(/---\n.*?\n---\n\n/s)[1];
    expect(bodyPart).toBe(bodyContent);
  });

  it("should handle Map with complex keys and values", () => {
    const trellisObject: TrellisObject = {
      id: "complex-map-test",
      title: "Complex Map Test",
      status: TrellisObjectStatus.IN_PROGRESS,
      priority: TrellisObjectPriority.HIGH,
      prerequisites: [],
      affectedFiles: new Map([
        ["path/to/complex file name.ts", "created"],
        ["another/path/file.js", "modified"],
        ["config/settings.json", "deleted"],
      ]),
      log: [],
      schema: "v1.0",
      childrenIds: [],
      body: "Test content",
      type: TrellisObjectType.PROJECT,
    };

    const result = serializeTrellisObject(trellisObject);
    const yamlPart = result.split("---\n")[1];
    const parsedYaml = parse(yamlPart);

    expect(parsedYaml.affectedFiles).toEqual({
      "path/to/complex file name.ts": "created",
      "another/path/file.js": "modified",
      "config/settings.json": "deleted",
    });
  });
});
