import { Repository } from "../../repositories/Repository";
import {
  TrellisObject,
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../../models";
import { handleReplaceObjectBodyRegex } from "../replaceObjectBodyRegexTool";

describe("replaceObjectBodyRegexTool", () => {
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

  describe("handleReplaceObjectBodyRegex", () => {
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

    it("should successfully replace text using simple regex pattern", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "old content",
        replacement: "new content",
      });

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

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "Name: (\\w+) (\\w+)",
        replacement: "Name: $2, $1",
      });

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

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "Section A:.*?End Section A",
        replacement: "Section A:\nThis is new content\nEnd Section A",
      });

      const expectedUpdatedObject = {
        ...objectWithMultilineContent,
        body: "Section A:\nThis is new content\nEnd Section A",
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully replaced content");
    });

    it("should allow multiple occurrences when specified", async () => {
      const objectWithRepeats = {
        ...mockTrellisObject,
        body: "Replace this word and also replace this word again.",
      };

      mockRepository.getObjectById.mockResolvedValue(objectWithRepeats);
      mockRepository.saveObject.mockResolvedValue();

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "replace",
        replacement: "update",
        allowMultipleOccurrences: true,
      });

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

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "test",
        replacement: "demo",
      });

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toContain("Found 2 matches for pattern");
      expect(result.content[0].text).toContain(
        "allowMultipleOccurrences is false",
      );
    });

    it("should return error when object is not found", async () => {
      mockRepository.getObjectById.mockResolvedValue(null);

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-nonexistent",
        regex: "old",
        replacement: "new",
      });

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

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "old",
        replacement: "new",
      });

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(
        "Error: Object with ID 'T-test-task' has no body content to replace",
      );
    });

    it("should inform user when no matches are found", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "nonexistent pattern",
        replacement: "new content",
      });

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(
        'No matches found for pattern "nonexistent pattern" in object body. Body remains unchanged.',
      );
    });

    it("should handle invalid regex patterns gracefully", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "[invalid regex",
        replacement: "new content",
      });

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toContain("Error replacing object body:");
      expect(result.content[0].text).toContain("Invalid regex pattern");
    });

    it("should handle repository errors gracefully", async () => {
      mockRepository.getObjectById.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "old",
        replacement: "new",
      });

      expect(result.content[0].text).toBe(
        "Error replacing object body: Database connection failed",
      );
    });

    it("should handle save errors gracefully", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockRejectedValue(new Error("Failed to save"));

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "old content",
        replacement: "new content",
      });

      expect(result.content[0].text).toBe(
        "Error replacing object body: Failed to save",
      );
    });

    it("should handle empty regex pattern", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "",
        replacement: "new content",
      });

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toContain("Regex pattern cannot be empty");
    });

    it("should preserve object metadata when updating body", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();

      await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "old content",
        replacement: "new content",
      });

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

      const result = await handleReplaceObjectBodyRegex(mockRepository, {
        id: "T-test-task",
        regex: "(## Section to Update\\s+).*?(\\s+End of section)",
        replacement: "$1New implementation details$2",
      });

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
  });
});
