import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
  type TrellisObject,
} from "../../../models";
import type { Repository } from "../../../repositories/Repository";
import { renderDetailView } from "../renderDetailView";

const stubRepo = {
  getObjectById: () => Promise.resolve(null),
} as unknown as Repository;

function makeObj(overrides: Partial<TrellisObject> = {}): TrellisObject {
  return {
    id: "T-test",
    type: TrellisObjectType.TASK,
    title: "Test",
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

it("renders External issue ID section when top-level and set", async () => {
  const html = await renderDetailView(
    "k",
    makeObj({ parent: null, externalIssueId: "JIRA-42" }),
    stubRepo,
  );
  expect(html).toContain("External issue ID");
  expect(html).toContain("JIRA-42");
});

it("omits section when top-level but externalIssueId is unset", async () => {
  const html = await renderDetailView("k", makeObj({ parent: null }), stubRepo);
  expect(html).not.toContain("External issue ID");
});

it("omits section for child issues even when externalIssueId is set", async () => {
  const html = await renderDetailView(
    "k",
    makeObj({ parent: "P-parent", externalIssueId: "JIRA-42" }),
    stubRepo,
  );
  expect(html).not.toContain("External issue ID");
});

it("renders File field with path and Open raw link when filePath given", async () => {
  const path = "/Users/me/.trellis/projects/k/t/open/T-test.md";
  const html = await renderDetailView("k", makeObj(), stubRepo, [], path);
  expect(html).toContain(">File<");
  expect(html).toContain(path);
  expect(html).toContain('href="/projects/k/issues/T-test/file"');
});

it("omits File field when filePath is null", async () => {
  const html = await renderDetailView("k", makeObj(), stubRepo, [], null);
  expect(html).not.toContain(">File<");
});

it("renders the id chip as a click-to-copy control", async () => {
  const html = await renderDetailView("k", makeObj({ id: "T-xyz" }), stubRepo);
  expect(html).toContain('class="id-chip"');
  expect(html).toContain('data-copy="T-xyz"');
  expect(html).toContain('role="button"');
  expect(html).toContain("navigator.clipboard.writeText");
});
