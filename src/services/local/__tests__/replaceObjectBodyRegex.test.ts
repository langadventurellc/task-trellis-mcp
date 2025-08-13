import {
  TrellisObject,
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../../../models";
import { Repository } from "../../../repositories/Repository";
import { replaceObjectBodyRegex } from "../replaceObjectBodyRegex";

describe("replaceObjectBodyRegex", () => {
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };
    jest.clearAllMocks();
  });

  const mockTrellisObject: TrellisObject = {
    id: "T-test-task",
    type: TrellisObjectType.TASK,
    title: "Test Task",
    status: TrellisObjectStatus.OPEN,
    priority: TrellisObjectPriority.MEDIUM,
    parent: "F-test-feature",
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: [],
    body: "This is the old content that needs to be replaced with new content.",
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
  };

  describe("successful regex replacements", () => {
    it("should successfully replace text using simple regex pattern", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "old content",
        "new content",
        false,
      );

      const expectedUpdatedObject = {
        ...mockTrellisObject,
        body: "This is the new content that needs to be replaced with new content.",
      };

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-test-task");
      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain(
        'Successfully replaced content in object body using pattern "old content"',
      );
      expect(result.content[0].text).toContain("T-test-task");
    });

    it("should successfully replace text using regex with backreferences", async () => {
      const objectWithNames = {
        ...mockTrellisObject,
        body: "Name: John Doe",
      };

      mockRepository.getObjectById.mockResolvedValue(objectWithNames);
      mockRepository.saveObject.mockResolvedValue();

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "Name: (\\w+) (\\w+)",
        "Name: $2, $1",
        false,
      );

      const expectedUpdatedObject = {
        ...objectWithNames,
        body: "Name: Doe, John",
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully replaced content");
    });

    it("should handle multiline regex patterns", async () => {
      const objectWithMultilineContent = {
        ...mockTrellisObject,
        body: `Section A:
This is old content
that spans multiple lines
End Section A`,
      };

      mockRepository.getObjectById.mockResolvedValue(
        objectWithMultilineContent,
      );
      mockRepository.saveObject.mockResolvedValue();

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "Section A:.*?End Section A",
        "Section A:\nThis is new content\nEnd Section A",
        false,
      );

      const expectedUpdatedObject = {
        ...objectWithMultilineContent,
        body: "Section A:\nThis is new content\nEnd Section A",
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully replaced content");
    });

    it("should handle complex patterns with context", async () => {
      const objectWithSections = {
        ...mockTrellisObject,
        body: `# Header 1
Some content here

## Section to Update
Old implementation details
End of section

# Header 2
Other content`,
      };

      mockRepository.getObjectById.mockResolvedValue(objectWithSections);
      mockRepository.saveObject.mockResolvedValue();

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "(## Section to Update\\s+).*?(\\s+End of section)",
        "$1New implementation details$2",
        false,
      );

      const expectedBody = `# Header 1
Some content here

## Section to Update
New implementation details
End of section

# Header 2
Other content`;

      const expectedUpdatedObject = {
        ...objectWithSections,
        body: expectedBody,
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully replaced content");
    });

    it("should preserve object metadata when updating body", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();

      await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "old content",
        "new content",
        false,
      );

      const savedObject = mockRepository.saveObject.mock.calls[0][0];

      expect(savedObject.id).toBe(mockTrellisObject.id);
      expect(savedObject.type).toBe(mockTrellisObject.type);
      expect(savedObject.title).toBe(mockTrellisObject.title);
      expect(savedObject.status).toBe(mockTrellisObject.status);
      expect(savedObject.priority).toBe(mockTrellisObject.priority);
      expect(savedObject.prerequisites).toBe(mockTrellisObject.prerequisites);
      expect(savedObject.created).toBe(mockTrellisObject.created);
      expect(savedObject.updated).toBe(mockTrellisObject.updated);
      expect(savedObject.body).toBe(
        "This is the new content that needs to be replaced with new content.",
      );
    });
  });

  describe("multiple occurrences handling", () => {
    it("should allow multiple occurrences when specified", async () => {
      const objectWithRepeats = {
        ...mockTrellisObject,
        body: "Replace this word and also replace this word again.",
      };

      mockRepository.getObjectById.mockResolvedValue(objectWithRepeats);
      mockRepository.saveObject.mockResolvedValue();

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "replace",
        "update",
        true,
      );

      const expectedUpdatedObject = {
        ...objectWithRepeats,
        body: "Replace this word and also update this word again.",
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully replaced content");
    });

    it("should reject multiple occurrences when not allowed", async () => {
      const objectWithRepeats = {
        ...mockTrellisObject,
        body: "test content and more test content",
      };

      mockRepository.getObjectById.mockResolvedValue(objectWithRepeats);

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "test",
        "demo",
        false,
      );

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toContain("Found 2 matches for pattern");
      expect(result.content[0].text).toContain(
        "allowMultipleOccurrences is false",
      );
    });
  });

  describe("error handling", () => {
    it("should return error when object is not found", async () => {
      mockRepository.getObjectById.mockResolvedValue(null);

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-nonexistent",
        "old",
        "new",
        false,
      );

      expect(mockRepository.getObjectById).toHaveBeenCalledWith(
        "T-nonexistent",
      );
      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(
        "Error: Object with ID 'T-nonexistent' not found",
      );
    });

    it("should return error when object has no body content", async () => {
      const objectWithoutBody = {
        ...mockTrellisObject,
        body: "",
      };

      mockRepository.getObjectById.mockResolvedValue(objectWithoutBody);

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "old",
        "new",
        false,
      );

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(
        "Error: Object with ID 'T-test-task' has no body content to replace",
      );
    });

    it("should handle invalid regex patterns gracefully", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "[invalid regex",
        "new content",
        false,
      );

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toContain("Error replacing object body:");
      expect(result.content[0].text).toContain("Invalid regex pattern");
    });

    it("should handle repository errors gracefully", async () => {
      mockRepository.getObjectById.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "old",
        "new",
        false,
      );

      expect(result.content[0].text).toBe(
        "Error replacing object body: Database connection failed",
      );
    });

    it("should handle save errors gracefully", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockRejectedValue(new Error("Failed to save"));

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "old content",
        "new content",
        false,
      );

      expect(result.content[0].text).toBe(
        "Error replacing object body: Failed to save",
      );
    });

    it("should handle empty regex pattern", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "",
        "new content",
        false,
      );

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toContain("Regex pattern cannot be empty");
    });
  });

  describe("edge cases", () => {
    it("should inform user when no matches are found", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "nonexistent pattern",
        "new content",
        false,
      );

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(
        'No matches found for pattern "nonexistent pattern" in object body. Body remains unchanged.',
      );
    });

    it("should handle empty replacement string", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "old content",
        "",
        false,
      );

      const expectedUpdatedObject = {
        ...mockTrellisObject,
        body: "This is the  that needs to be replaced with new content.",
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully replaced content");
    });

    it("should handle null body property", async () => {
      const objectWithNullBody = {
        ...mockTrellisObject,
        body: null as any,
      };

      mockRepository.getObjectById.mockResolvedValue(objectWithNullBody);

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "old",
        "new",
        false,
      );

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(
        "Error: Object with ID 'T-test-task' has no body content to replace",
      );
    });

    it("should handle undefined body property", async () => {
      const objectWithUndefinedBody = {
        ...mockTrellisObject,
      };
      delete (objectWithUndefinedBody as any).body;

      mockRepository.getObjectById.mockResolvedValue(objectWithUndefinedBody);

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "old",
        "new",
        false,
      );

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(
        "Error: Object with ID 'T-test-task' has no body content to replace",
      );
    });
  });

  describe("parameter handling", () => {
    it("should handle allowMultipleOccurrences default parameter", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "old content",
        "new content",
      );

      const expectedUpdatedObject = {
        ...mockTrellisObject,
        body: "This is the new content that needs to be replaced with new content.",
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully replaced content");
    });

    it("should handle special regex characters correctly", async () => {
      const objectWithSpecialChars = {
        ...mockTrellisObject,
        body: "Price: $100.50",
      };

      mockRepository.getObjectById.mockResolvedValue(objectWithSpecialChars);
      mockRepository.saveObject.mockResolvedValue();

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "\\$\\d+\\.\\d+",
        "$200.75",
        false,
      );

      const expectedUpdatedObject = {
        ...objectWithSpecialChars,
        body: "Price: $200.75",
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully replaced content");
    });

    it("should handle large text bodies efficiently", async () => {
      const largeBody = "x".repeat(10000) + "target text" + "y".repeat(10000);
      const objectWithLargeBody = {
        ...mockTrellisObject,
        body: largeBody,
      };

      mockRepository.getObjectById.mockResolvedValue(objectWithLargeBody);
      mockRepository.saveObject.mockResolvedValue();

      const result = await replaceObjectBodyRegex(
        mockRepository,
        "T-test-task",
        "target text",
        "replacement text",
        false,
      );

      const expectedBody =
        "x".repeat(10000) + "replacement text" + "y".repeat(10000);
      const expectedUpdatedObject = {
        ...objectWithLargeBody,
        body: expectedBody,
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully replaced content");
    });
  });
});
