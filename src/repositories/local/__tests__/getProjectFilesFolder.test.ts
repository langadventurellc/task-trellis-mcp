import { join } from "path";
import { getProjectFilesFolder } from "../getProjectFilesFolder";

describe("getProjectFilesFolder", () => {
  it("returns <root>/files for a typical root", () => {
    expect(getProjectFilesFolder("/planning")).toBe(join("/planning", "files"));
  });

  it("joins correctly when root has a trailing slash", () => {
    expect(getProjectFilesFolder("/planning/")).toBe(
      join("/planning/", "files"),
    );
  });
});
