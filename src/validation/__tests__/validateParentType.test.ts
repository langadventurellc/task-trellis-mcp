import { TrellisObjectType } from "../../models/TrellisObjectType";
import { validateParentType } from "../validateParentType";

describe("validateParentType", () => {
  describe("Projects", () => {
    it("should allow projects with no parent", () => {
      expect(() => {
        validateParentType(TrellisObjectType.PROJECT, null);
      }).not.toThrow();

      expect(() => {
        validateParentType(TrellisObjectType.PROJECT, undefined);
      }).not.toThrow();
    });

    it("should reject projects with any parent", () => {
      expect(() => {
        validateParentType(TrellisObjectType.PROJECT, "P-parent");
      }).toThrow("Projects cannot have parents");

      expect(() => {
        validateParentType(TrellisObjectType.PROJECT, "E-parent");
      }).toThrow("Projects cannot have parents");

      expect(() => {
        validateParentType(TrellisObjectType.PROJECT, "F-parent");
      }).toThrow("Projects cannot have parents");

      expect(() => {
        validateParentType(TrellisObjectType.PROJECT, "T-parent");
      }).toThrow("Projects cannot have parents");
    });
  });

  describe("Epics", () => {
    it("should require epics to have a project parent", () => {
      expect(() => {
        validateParentType(TrellisObjectType.EPIC, "P-project");
      }).not.toThrow();
    });

    it("should reject epics with no parent", () => {
      expect(() => {
        validateParentType(TrellisObjectType.EPIC, null);
      }).toThrow("Epics must have a project as a parent");

      expect(() => {
        validateParentType(TrellisObjectType.EPIC, undefined);
      }).toThrow("Epics must have a project as a parent");
    });

    it("should reject epics with non-project parents", () => {
      expect(() => {
        validateParentType(TrellisObjectType.EPIC, "E-epic");
      }).toThrow("Epics must have a project as a parent");

      expect(() => {
        validateParentType(TrellisObjectType.EPIC, "F-feature");
      }).toThrow("Epics must have a project as a parent");

      expect(() => {
        validateParentType(TrellisObjectType.EPIC, "T-task");
      }).toThrow("Epics must have a project as a parent");
    });
  });

  describe("Features", () => {
    it("should allow features with epic parent", () => {
      expect(() => {
        validateParentType(TrellisObjectType.FEATURE, "E-epic");
      }).not.toThrow();
    });

    it("should allow features with no parent", () => {
      expect(() => {
        validateParentType(TrellisObjectType.FEATURE, null);
      }).not.toThrow();

      expect(() => {
        validateParentType(TrellisObjectType.FEATURE, undefined);
      }).not.toThrow();
    });

    it("should reject features with non-epic parents", () => {
      expect(() => {
        validateParentType(TrellisObjectType.FEATURE, "P-project");
      }).toThrow("Features can only have an epic as a parent");

      expect(() => {
        validateParentType(TrellisObjectType.FEATURE, "F-feature");
      }).toThrow("Features can only have an epic as a parent");

      expect(() => {
        validateParentType(TrellisObjectType.FEATURE, "T-task");
      }).toThrow("Features can only have an epic as a parent");
    });
  });

  describe("Tasks", () => {
    it("should allow tasks with feature parent", () => {
      expect(() => {
        validateParentType(TrellisObjectType.TASK, "F-feature");
      }).not.toThrow();
    });

    it("should allow tasks with no parent", () => {
      expect(() => {
        validateParentType(TrellisObjectType.TASK, null);
      }).not.toThrow();

      expect(() => {
        validateParentType(TrellisObjectType.TASK, undefined);
      }).not.toThrow();
    });

    it("should reject tasks with non-feature parents", () => {
      expect(() => {
        validateParentType(TrellisObjectType.TASK, "P-project");
      }).toThrow("Tasks can only have a feature as a parent");

      expect(() => {
        validateParentType(TrellisObjectType.TASK, "E-epic");
      }).toThrow("Tasks can only have a feature as a parent");

      expect(() => {
        validateParentType(TrellisObjectType.TASK, "T-task");
      }).toThrow("Tasks can only have a feature as a parent");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string as no parent", () => {
      expect(() => {
        validateParentType(TrellisObjectType.PROJECT, "");
      }).not.toThrow();

      expect(() => {
        validateParentType(TrellisObjectType.FEATURE, "");
      }).not.toThrow();

      expect(() => {
        validateParentType(TrellisObjectType.TASK, "");
      }).not.toThrow();

      expect(() => {
        validateParentType(TrellisObjectType.EPIC, "");
      }).toThrow("Epics must have a project as a parent");
    });
  });
});
