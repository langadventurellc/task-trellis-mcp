import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import type { TrellisObject } from "../../../models";
import { pruneCompletedSubtrees } from "../pruneCompletedSubtrees";

function makeObj(overrides: Partial<TrellisObject> = {}): TrellisObject {
  return {
    id: "T-test",
    type: TrellisObjectType.TASK,
    title: "Test Task",
    status: TrellisObjectStatus.OPEN,
    priority: TrellisObjectPriority.MEDIUM,
    parent: null,
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "v1.0",
    childrenIds: [],
    created: "2026-01-01T00:00:00Z",
    updated: "2026-01-01T00:00:00Z",
    body: "",
    ...overrides,
  };
}

describe("pruneCompletedSubtrees", () => {
  it("removes a done root and all its descendants, even if descendants are open or in-progress", () => {
    const root = makeObj({
      id: "F-done",
      type: TrellisObjectType.FEATURE,
      status: TrellisObjectStatus.DONE,
      childrenIds: ["T-open", "T-progress"],
    });
    const open = makeObj({ id: "T-open", parent: "F-done" });
    const progress = makeObj({
      id: "T-progress",
      status: TrellisObjectStatus.IN_PROGRESS,
      parent: "F-done",
    });
    const other = makeObj({ id: "T-other" });

    const result = pruneCompletedSubtrees([root, open, progress, other]);

    const ids = result.map((o) => o.id);
    expect(ids).not.toContain("F-done");
    expect(ids).not.toContain("T-open");
    expect(ids).not.toContain("T-progress");
    expect(ids).toContain("T-other");
  });

  it("removes a wont-do subtree the same way", () => {
    const root = makeObj({
      id: "F-wontdo",
      type: TrellisObjectType.FEATURE,
      status: TrellisObjectStatus.WONT_DO,
      childrenIds: ["T-child"],
    });
    const child = makeObj({ id: "T-child", parent: "F-wontdo" });

    const result = pruneCompletedSubtrees([root, child]);

    expect(result).toHaveLength(0);
  });

  it("keeps non-closed roots and their subtrees intact", () => {
    const root = makeObj({
      id: "F-open",
      type: TrellisObjectType.FEATURE,
      status: TrellisObjectStatus.OPEN,
      childrenIds: ["T-child"],
    });
    const child = makeObj({ id: "T-child", parent: "F-open" });
    const inProgress = makeObj({
      id: "T-progress",
      status: TrellisObjectStatus.IN_PROGRESS,
    });

    const result = pruneCompletedSubtrees([root, child, inProgress]);

    const ids = result.map((o) => o.id);
    expect(ids).toContain("F-open");
    expect(ids).toContain("T-child");
    expect(ids).toContain("T-progress");
    expect(result).toHaveLength(3);
  });
});
