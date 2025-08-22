import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import { handleAppendModifiedFiles } from "../appendModifiedFilesTool";

describe("appendModifiedFilesTool", () => {
  let mockService: TaskTrellisService;
  let mockRepository: jest.Mocked<Repository>;
  let appendModifiedFilesSpy: jest.Mock;

  beforeEach(() => {
    appendModifiedFilesSpy = jest.fn();
    mockService = {
      appendModifiedFiles: appendModifiedFilesSpy,
    } as unknown as TaskTrellisService;

    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
      getChildrenOf: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("handleAppendModifiedFiles", () => {
    it("should call service.appendModifiedFiles with correct parameters", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Successfully appended 2 modified files to object T-test-task",
          },
        ],
      };

      appendModifiedFilesSpy.mockResolvedValue(mockResult);

      const args = {
        id: "T-test-task",
        filesChanged: {
          "src/components/Button.tsx": "Added new button component",
          "src/utils/helpers.ts": "Created utility functions",
        },
      };

      const result = await handleAppendModifiedFiles(
        mockService,
        mockRepository,
        args,
      );

      expect(appendModifiedFilesSpy).toHaveBeenCalledWith(
        mockRepository,
        "T-test-task",
        {
          "src/components/Button.tsx": "Added new button component",
          "src/utils/helpers.ts": "Created utility functions",
        },
      );
      expect(result).toBe(mockResult);
    });

    it("should handle empty filesChanged object", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Successfully appended 0 modified files to object T-test-task",
          },
        ],
      };

      appendModifiedFilesSpy.mockResolvedValue(mockResult);

      const args = {
        id: "T-test-task",
        filesChanged: {},
      };

      const result = await handleAppendModifiedFiles(
        mockService,
        mockRepository,
        args,
      );

      expect(appendModifiedFilesSpy).toHaveBeenCalledWith(
        mockRepository,
        "T-test-task",
        {},
      );
      expect(result).toBe(mockResult);
    });

    it("should handle single file modification", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Successfully appended 1 modified file to object F-test-feature",
          },
        ],
      };

      appendModifiedFilesSpy.mockResolvedValue(mockResult);

      const args = {
        id: "F-test-feature",
        filesChanged: {
          "README.md": "Updated documentation",
        },
      };

      await handleAppendModifiedFiles(mockService, mockRepository, args);

      expect(appendModifiedFilesSpy).toHaveBeenCalledWith(
        mockRepository,
        "F-test-feature",
        {
          "README.md": "Updated documentation",
        },
      );
    });

    it("should handle complex file paths and descriptions", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Successfully appended 3 modified files to object T-complex-task",
          },
        ],
      };

      appendModifiedFilesSpy.mockResolvedValue(mockResult);

      const args = {
        id: "T-complex-task",
        filesChanged: {
          "src/components/forms/LoginForm.tsx":
            "Implemented user authentication form with validation",
          "src/services/api/authService.ts":
            "Added login and logout API endpoints",
          "tests/unit/auth.test.ts":
            "Added comprehensive test suite for authentication",
        },
      };

      await handleAppendModifiedFiles(mockService, mockRepository, args);

      expect(appendModifiedFilesSpy).toHaveBeenCalledWith(
        mockRepository,
        "T-complex-task",
        {
          "src/components/forms/LoginForm.tsx":
            "Implemented user authentication form with validation",
          "src/services/api/authService.ts":
            "Added login and logout API endpoints",
          "tests/unit/auth.test.ts":
            "Added comprehensive test suite for authentication",
        },
      );
    });

    it("should handle service errors", async () => {
      const errorResult = {
        content: [
          {
            type: "text",
            text: "Object with ID T-nonexistent not found",
          },
        ],
      };

      appendModifiedFilesSpy.mockResolvedValue(errorResult);

      const args = {
        id: "T-nonexistent",
        filesChanged: {
          "test.js": "Test file",
        },
      };

      const result = await handleAppendModifiedFiles(
        mockService,
        mockRepository,
        args,
      );

      expect(result).toBe(errorResult);
    });

    it("should handle argument parsing with additional properties", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Success",
          },
        ],
      };

      appendModifiedFilesSpy.mockResolvedValue(mockResult);

      const args = {
        id: "T-example",
        filesChanged: {
          "example.ts": "Example file",
        },
        extraProperty: "should be ignored",
        anotherExtra: 123,
      };

      await handleAppendModifiedFiles(mockService, mockRepository, args);

      expect(appendModifiedFilesSpy).toHaveBeenCalledWith(
        mockRepository,
        "T-example",
        {
          "example.ts": "Example file",
        },
      );
    });

    it("should preserve file descriptions with special characters", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Success",
          },
        ],
      };

      appendModifiedFilesSpy.mockResolvedValue(mockResult);

      const args = {
        id: "T-special-chars",
        filesChanged: {
          "src/components/Modal.tsx":
            "Added modal component with escape key handling & backdrop click",
          "src/styles/globals.css":
            "Updated CSS variables for theme switching; added dark mode support",
        },
      };

      await handleAppendModifiedFiles(mockService, mockRepository, args);

      expect(appendModifiedFilesSpy).toHaveBeenCalledWith(
        mockRepository,
        "T-special-chars",
        {
          "src/components/Modal.tsx":
            "Added modal component with escape key handling & backdrop click",
          "src/styles/globals.css":
            "Updated CSS variables for theme switching; added dark mode support",
        },
      );
    });
  });
});
