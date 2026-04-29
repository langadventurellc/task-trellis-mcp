import { assertSafeFilename } from "../assertSafeFilename";

describe("assertSafeFilename", () => {
  describe("accepts valid filenames", () => {
    it("accepts a plain filename", () => {
      expect(() => assertSafeFilename("foo.md")).not.toThrow();
    });

    it("accepts a hidden file", () => {
      expect(() => assertSafeFilename(".gitignore")).not.toThrow();
    });

    it("accepts a multi-dot filename", () => {
      expect(() => assertSafeFilename("a.b.c.txt")).not.toThrow();
    });
  });

  describe("rejects invalid filenames", () => {
    it("rejects empty string", () => {
      expect(() => assertSafeFilename("")).toThrow(
        "Filename must be a non-empty string",
      );
    });

    it("rejects '.'", () => {
      expect(() => assertSafeFilename(".")).toThrow("Invalid filename: '.'");
    });

    it("rejects '..'", () => {
      expect(() => assertSafeFilename("..")).toThrow("Invalid filename: '..'");
    });

    it("rejects filename with forward slash", () => {
      expect(() => assertSafeFilename("foo/bar")).toThrow(
        "Invalid filename 'foo/bar': must not contain path separators",
      );
    });

    it("rejects filename with backslash", () => {
      expect(() => assertSafeFilename("foo\\bar")).toThrow(
        "Invalid filename 'foo\\bar': must not contain path separators",
      );
    });

    it("rejects embedded '..' (parent traversal)", () => {
      expect(() => assertSafeFilename("../etc/passwd")).toThrow(
        "Invalid filename '../etc/passwd': must not contain path separators",
      );
    });

    it("rejects absolute path", () => {
      expect(() => assertSafeFilename("/abs/path")).toThrow(
        "Invalid filename '/abs/path': must not contain path separators",
      );
    });

    it("rejects mid-string '..'", () => {
      expect(() => assertSafeFilename("a..b")).toThrow(
        "Invalid filename 'a..b': must not contain '..'",
      );
    });

    it("rejects filename with nul byte", () => {
      expect(() => assertSafeFilename("fo\x00o")).toThrow();
    });
  });
});
