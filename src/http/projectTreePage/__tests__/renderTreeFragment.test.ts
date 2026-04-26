import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import type { TrellisObject } from "../../../models";
import { renderTreeFragment } from "../renderTreeFragment";

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

describe("renderTreeFragment", () => {
  it("honors a supplied openSet — matching IDs render with open class, others do not", () => {
    const parent = makeObj({
      id: "F-open",
      type: TrellisObjectType.FEATURE,
      title: "Open Feature",
      childrenIds: ["T-child"],
      parent: null,
    });
    const child = makeObj({ id: "T-child", parent: "F-open" });
    const other = makeObj({
      id: "F-closed",
      type: TrellisObjectType.FEATURE,
      title: "Closed Feature",
      childrenIds: ["T-other-child"],
      parent: null,
    });
    const otherChild = makeObj({ id: "T-other-child", parent: "F-closed" });

    // Only F-open is in the supplied openSet
    const openSet = new Set(["F-open"]);
    const html = renderTreeFragment(
      "my-proj",
      [parent, child, other, otherChild],
      { openSet },
    );

    // F-open has children and is in openSet → renders with open class
    expect(html).toMatch(/class="row open"/);
    // F-closed has children but is NOT in openSet → no open class
    const closedIdx = html.indexOf("Closed Feature");
    const openIdx = html.indexOf("Open Feature");
    // Closed Feature row must not have open class; verify the row's class attribute
    const closedRowStart = html.lastIndexOf('<div class="row', closedIdx);
    expect(html.slice(closedRowStart, closedIdx)).not.toContain("open");
    // Open Feature row comes before its content
    expect(openIdx).toBeGreaterThan(-1);
    expect(closedIdx).toBeGreaterThan(-1);
  });

  it("with hideCompleted:true excludes done subtree IDs from HTML", () => {
    const doneRoot = makeObj({
      id: "F-done",
      type: TrellisObjectType.FEATURE,
      title: "Done Feature",
      status: TrellisObjectStatus.DONE,
      childrenIds: ["T-done-child"],
      parent: null,
    });
    const doneChild = makeObj({
      id: "T-done-child",
      title: "Done Child",
      parent: "F-done",
    });
    const openRoot = makeObj({
      id: "F-open",
      type: TrellisObjectType.FEATURE,
      title: "Open Feature",
      parent: null,
    });

    const html = renderTreeFragment(
      "my-proj",
      [doneRoot, doneChild, openRoot],
      { hideCompleted: true },
    );

    expect(html).not.toContain("F-done");
    expect(html).not.toContain("T-done-child");
    expect(html).toContain("F-open");
  });

  it("falls back to computeInitialOpenSet when openSet is omitted", () => {
    // F-parent has an in-progress child → computeInitialOpenSet will include F-parent
    const parent = makeObj({
      id: "F-parent",
      type: TrellisObjectType.FEATURE,
      title: "Parent Feature",
      childrenIds: ["T-inprogress"],
      parent: null,
    });
    const inProgress = makeObj({
      id: "T-inprogress",
      title: "In Progress Task",
      status: TrellisObjectStatus.IN_PROGRESS,
      parent: "F-parent",
    });

    // No options passed — should use computeInitialOpenSet
    const html = renderTreeFragment("my-proj", [parent, inProgress]);

    // F-parent is an ancestor of an in-progress task → open class expected
    expect(html).toMatch(/class="row open"/);
    expect(html).toContain("Parent Feature");
  });
});
