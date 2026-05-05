import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import type { TrellisObject } from "../../../models";
import { computeInitialOpenSet } from "../computeInitialOpenSet";
import { treeRow } from "../treeRow";

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
    labels: [],
    created: "2026-01-01T00:00:00Z",
    updated: "2026-01-01T00:00:00Z",
    body: "",
    ...overrides,
  };
}

describe("treeRow", () => {
  it("emits data-id attribute matching the object id", () => {
    const task = makeObj({ id: "T-abc", childrenIds: [] });
    const html = treeRow("my-proj", task, 0);
    expect(html).toContain('data-id="T-abc"');
  });
});

describe("computeInitialOpenSet", () => {
  it("includes the in-progress issue's own id when it has children", () => {
    const parent = makeObj({
      id: "F-parent",
      type: TrellisObjectType.FEATURE,
      status: TrellisObjectStatus.IN_PROGRESS,
      childrenIds: ["T-child"],
      labels: [],
      parent: null,
    });
    const child = makeObj({ id: "T-child", parent: "F-parent" });

    const open = computeInitialOpenSet([parent, child]);

    expect(open.has("F-parent")).toBe(true);
  });

  it("includes ancestors of in-progress issues (regression)", () => {
    const grandparent = makeObj({
      id: "P-gp",
      type: TrellisObjectType.PROJECT,
      childrenIds: ["F-mid"],
      labels: [],
      parent: null,
    });
    const middle = makeObj({
      id: "F-mid",
      type: TrellisObjectType.FEATURE,
      childrenIds: ["T-leaf"],
      labels: [],
      parent: "P-gp",
    });
    const leaf = makeObj({
      id: "T-leaf",
      status: TrellisObjectStatus.IN_PROGRESS,
      parent: "F-mid",
    });

    const open = computeInitialOpenSet([grandparent, middle, leaf]);

    expect(open.has("P-gp")).toBe(true);
    expect(open.has("F-mid")).toBe(true);
  });

  it("includes a childless in-progress id in the set but treeRow renders no open class", () => {
    const task = makeObj({
      id: "T-solo",
      status: TrellisObjectStatus.IN_PROGRESS,
      childrenIds: [],
      labels: [],
      parent: null,
    });

    const open = computeInitialOpenSet([task]);

    // The id is in the open set
    expect(open.has("T-solo")).toBe(true);

    // But treeRow omits the open class because there are no children
    const html = treeRow("my-proj", task, 0, { open: true });
    expect(html).not.toContain(" open");
  });
});
