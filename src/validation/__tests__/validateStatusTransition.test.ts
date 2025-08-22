import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories/Repository";
import { validateStatusTransition } from "../validateStatusTransition";

// Mock the checkPrerequisitesComplete function
jest.mock("../../utils/checkPrerequisitesComplete", () => ({
  checkPrerequisitesComplete: jest.fn(),
}));

import { checkPrerequisitesComplete } from "../../utils/checkPrerequisitesComplete";

const mockCheckPrerequisitesComplete =
  checkPrerequisitesComplete as jest.MockedFunction<
    typeof checkPrerequisitesComplete
  >;

describe("validateStatusTransition", () => {
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
      getChildrenOf: jest.fn(),
    };
    jest.clearAllMocks();
  });

  const createMockObject = (
    id: string,
    status: TrellisObjectStatus,
    prerequisites: string[] = [],
  ): TrellisObject => ({
    id,
    type: TrellisObjectType.TASK,
    title: "Test Task",
    status,
    priority: TrellisObjectPriority.MEDIUM,
    parent: "F-test-feature",
    prerequisites,
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: [],
    body: "Test body",
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
  });

  describe("Status transition validation", () => {
    it("should allow transition to IN_PROGRESS when prerequisites are complete", async () => {
      const object = createMockObject(
        "T-test",
        TrellisObjectStatus.IN_PROGRESS,
      );
      mockCheckPrerequisitesComplete.mockResolvedValue(true);

      await expect(
        validateStatusTransition(object, mockRepository),
      ).resolves.not.toThrow();

      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        object,
        mockRepository,
      );
    });

    it("should allow transition to DONE when prerequisites are complete", async () => {
      const object = createMockObject("T-test", TrellisObjectStatus.DONE);
      mockCheckPrerequisitesComplete.mockResolvedValue(true);

      await expect(
        validateStatusTransition(object, mockRepository),
      ).resolves.not.toThrow();

      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        object,
        mockRepository,
      );
    });

    it("should reject transition to IN_PROGRESS when prerequisites are not complete", async () => {
      const object = createMockObject(
        "T-test",
        TrellisObjectStatus.IN_PROGRESS,
      );
      mockCheckPrerequisitesComplete.mockResolvedValue(false);

      await expect(
        validateStatusTransition(object, mockRepository),
      ).rejects.toThrow(
        "Cannot update status to 'in-progress' - prerequisites are not complete. Use force=true to override.",
      );

      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        object,
        mockRepository,
      );
    });

    it("should reject transition to DONE when prerequisites are not complete", async () => {
      const object = createMockObject("T-test", TrellisObjectStatus.DONE);
      mockCheckPrerequisitesComplete.mockResolvedValue(false);

      await expect(
        validateStatusTransition(object, mockRepository),
      ).rejects.toThrow(
        "Cannot update status to 'done' - prerequisites are not complete. Use force=true to override.",
      );

      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        object,
        mockRepository,
      );
    });

    it("should not validate prerequisites for DRAFT status", async () => {
      const object = createMockObject("T-test", TrellisObjectStatus.DRAFT);

      await expect(
        validateStatusTransition(object, mockRepository),
      ).resolves.not.toThrow();

      expect(mockCheckPrerequisitesComplete).not.toHaveBeenCalled();
    });

    it("should not validate prerequisites for OPEN status", async () => {
      const object = createMockObject("T-test", TrellisObjectStatus.OPEN);

      await expect(
        validateStatusTransition(object, mockRepository),
      ).resolves.not.toThrow();

      expect(mockCheckPrerequisitesComplete).not.toHaveBeenCalled();
    });

    it("should not validate prerequisites for WONT_DO status", async () => {
      const object = createMockObject("T-test", TrellisObjectStatus.WONT_DO);

      await expect(
        validateStatusTransition(object, mockRepository),
      ).resolves.not.toThrow();

      expect(mockCheckPrerequisitesComplete).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should propagate errors from checkPrerequisitesComplete", async () => {
      const object = createMockObject(
        "T-test",
        TrellisObjectStatus.IN_PROGRESS,
      );
      const checkError = new Error("Repository error");
      mockCheckPrerequisitesComplete.mockRejectedValue(checkError);

      await expect(
        validateStatusTransition(object, mockRepository),
      ).rejects.toThrow("Repository error");
    });
  });

  describe("Complex scenarios", () => {
    it("should validate objects with prerequisites when transitioning to IN_PROGRESS", async () => {
      const object = createMockObject(
        "T-test",
        TrellisObjectStatus.IN_PROGRESS,
        ["T-prereq-1", "T-prereq-2"],
      );
      mockCheckPrerequisitesComplete.mockResolvedValue(true);

      await expect(
        validateStatusTransition(object, mockRepository),
      ).resolves.not.toThrow();

      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        object,
        mockRepository,
      );
    });

    it("should reject objects with incomplete prerequisites when transitioning to DONE", async () => {
      const object = createMockObject("T-test", TrellisObjectStatus.DONE, [
        "T-prereq-1",
        "T-prereq-2",
        "T-prereq-3",
      ]);
      mockCheckPrerequisitesComplete.mockResolvedValue(false);

      await expect(
        validateStatusTransition(object, mockRepository),
      ).rejects.toThrow(
        "Cannot update status to 'done' - prerequisites are not complete. Use force=true to override.",
      );
    });
  });
});
