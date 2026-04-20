import { mkdir, mkdtemp, rm, unlink, utimes, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { RepoIndex } from "../RepoIndex";

function mdContent(id: string, title = id): string {
  return [
    "---",
    `id: ${id}`,
    `title: ${title}`,
    "status: open",
    "priority: high",
    "schema: v1.0",
    "created: 2025-01-01T00:00:00Z",
    "updated: 2025-01-01T00:00:00Z",
    "---",
    "",
    `# ${title}`,
    "",
  ].join("\n");
}

describe("RepoIndex", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "repo-index-test-"));
    await mkdir(join(tempRoot, "t", "open"), { recursive: true });
  });

  afterEach(async () => {
    RepoIndex.invalidateAll(tempRoot);
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("cold lookup returns null", async () => {
    const result = await RepoIndex.lookup(tempRoot, "T-anything");
    expect(result).toBeNull();
  });

  it("warm lookup returns the correct file path after populate", async () => {
    const filePath = join(tempRoot, "t", "open", "T-a.md");
    await writeFile(filePath, mdContent("T-a"));

    await RepoIndex.populate(tempRoot);
    const result = await RepoIndex.lookup(tempRoot, "T-a");

    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(filePath);
    expect(typeof result!.mtime).toBe("number");
  });

  it("lookup returns null when file mtime has changed (stale detection)", async () => {
    const filePath = join(tempRoot, "t", "open", "T-a.md");
    await writeFile(filePath, mdContent("T-a"));
    await RepoIndex.populate(tempRoot);

    // Push mtime into the future so the cached value no longer matches.
    const future = new Date(Date.now() + 60_000);
    await utimes(filePath, future, future);

    const result = await RepoIndex.lookup(tempRoot, "T-a");
    expect(result).toBeNull();
  });

  it("lookup returns null after invalidate", async () => {
    const filePath = join(tempRoot, "t", "open", "T-a.md");
    await writeFile(filePath, mdContent("T-a"));
    await RepoIndex.populate(tempRoot);

    RepoIndex.invalidate(tempRoot, "T-a");

    const result = await RepoIndex.lookup(tempRoot, "T-a");
    expect(result).toBeNull();
  });

  it("lookup evicts and returns null when cached file has been deleted", async () => {
    const filePath = join(tempRoot, "t", "open", "T-a.md");
    await writeFile(filePath, mdContent("T-a"));
    await RepoIndex.populate(tempRoot);
    await unlink(filePath);

    const first = await RepoIndex.lookup(tempRoot, "T-a");
    expect(first).toBeNull();

    // Entry was evicted: even recreating the file should not re-hit until populate runs again.
    await writeFile(filePath, mdContent("T-a"));
    const second = await RepoIndex.lookup(tempRoot, "T-a");
    expect(second).toBeNull();
  });

  it("invalidateAll drops the entire bucket", async () => {
    await writeFile(join(tempRoot, "t", "open", "T-a.md"), mdContent("T-a"));
    await writeFile(join(tempRoot, "t", "open", "T-b.md"), mdContent("T-b"));
    await RepoIndex.populate(tempRoot);

    RepoIndex.invalidateAll(tempRoot);

    expect(await RepoIndex.lookup(tempRoot, "T-a")).toBeNull();
    expect(await RepoIndex.lookup(tempRoot, "T-b")).toBeNull();
  });

  it("populate skips files without an id field", async () => {
    await writeFile(join(tempRoot, "t", "open", "T-a.md"), mdContent("T-a"));
    await writeFile(
      join(tempRoot, "t", "open", "garbage.md"),
      "this file has no frontmatter",
    );

    await RepoIndex.populate(tempRoot);

    expect(await RepoIndex.lookup(tempRoot, "T-a")).not.toBeNull();
    const snapshot = RepoIndex.entries(tempRoot);
    expect(snapshot.map(([id]) => id)).toEqual(["T-a"]);
  });
});
