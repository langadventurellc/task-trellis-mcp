import { replaceStringWithRegex } from "../replaceStringWithRegex";
import { MultipleMatchesError } from "../MultipleMatchesError";
import type { ReplaceStringOptions } from "../ReplaceStringOptions";

describe("replaceStringWithRegex", () => {
  describe("basic functionality", () => {
    it("should replace simple string patterns", () => {
      const result = replaceStringWithRegex("hello world", {
        regex: "world",
        replacement: "universe",
      });
      expect(result).toBe("hello universe");
    });

    it("should return original string when no matches found", () => {
      const input = "hello world";
      const result = replaceStringWithRegex(input, {
        regex: "foo",
        replacement: "bar",
      });
      expect(result).toBe(input);
    });

    it("should handle empty replacement string", () => {
      const result = replaceStringWithRegex("hello world", {
        regex: "world",
        replacement: "",
      });
      expect(result).toBe("hello ");
    });

    it("should handle special regex characters", () => {
      const result = replaceStringWithRegex("Price: $10.99", {
        regex: "\\$\\d+\\.\\d+",
        replacement: "$25.00",
      });
      expect(result).toBe("Price: $25.00");
    });
  });

  describe("backreferences", () => {
    it("should handle backreferences with $1, $2 notation", () => {
      const result = replaceStringWithRegex("John Doe", {
        regex: "(\\w+) (\\w+)",
        replacement: "$2, $1",
      });
      expect(result).toBe("Doe, John");
    });

    it("should handle multiple backreferences", () => {
      const result = replaceStringWithRegex("2023-12-25", {
        regex: "(\\d{4})-(\\d{2})-(\\d{2})",
        replacement: "$2/$3/$1",
      });
      expect(result).toBe("12/25/2023");
    });

    it("should handle backreferences with surrounding text", () => {
      const result = replaceStringWithRegex("function getName() {", {
        regex: "function (\\w+)\\(\\)",
        replacement: "const $1 = () =>",
      });
      expect(result).toBe("const getName = () => {");
    });
  });

  describe("multiline and dotall matching", () => {
    it("should match across multiple lines with dot", () => {
      const input = "start\nmiddle\nend";
      const result = replaceStringWithRegex(input, {
        regex: "start.*end",
        replacement: "replaced",
      });
      expect(result).toBe("replaced");
    });

    it("should handle multiline strings with line anchors", () => {
      const input = "line1\nline2\nline3";
      const result = replaceStringWithRegex(input, {
        regex: "^line2$",
        replacement: "newline2",
      });
      expect(result).toBe("line1\nnewline2\nline3");
    });

    it("should match patterns spanning multiple lines", () => {
      const input = "function test() {\n  console.log('hello');\n}";
      const result = replaceStringWithRegex(input, {
        regex: "function test\\(\\).*?}",
        replacement: "const test = () => { console.log('hi'); }",
      });
      expect(result).toBe("const test = () => { console.log('hi'); }");
    });
  });

  describe("multiple occurrences handling", () => {
    it("should throw error when multiple matches found and not allowed", () => {
      expect(() => {
        replaceStringWithRegex("foo bar foo", {
          regex: "foo",
          replacement: "baz",
        });
      }).toThrow(MultipleMatchesError);
    });

    it("should provide detailed error message for multiple matches", () => {
      expect(() => {
        replaceStringWithRegex("test test test", {
          regex: "test",
          replacement: "replaced",
        });
      }).toThrow(
        'Found 3 matches for pattern "test" but allowMultipleOccurrences is false. ' +
          "Use allowMultipleOccurrences: true to replace all matches, or provide a more specific regex.",
      );
    });

    it("should replace all occurrences when allowMultipleOccurrences is true", () => {
      const result = replaceStringWithRegex("foo bar foo baz foo", {
        regex: "foo",
        replacement: "qux",
        allowMultipleOccurrences: true,
      });
      expect(result).toBe("qux bar qux baz qux");
    });

    it("should handle single match correctly regardless of allowMultipleOccurrences", () => {
      const result1 = replaceStringWithRegex("unique pattern", {
        regex: "unique",
        replacement: "special",
      });
      const result2 = replaceStringWithRegex("unique pattern", {
        regex: "unique",
        replacement: "special",
        allowMultipleOccurrences: true,
      });
      expect(result1).toBe("special pattern");
      expect(result2).toBe("special pattern");
    });

    it("should efficiently detect multiple matches in large strings without creating full array upfront", () => {
      // Create a large string with many matches to test performance optimization
      const pattern = "match";
      const largeString = Array(1000).fill(`${pattern} text`).join(" ");

      expect(() => {
        replaceStringWithRegex(largeString, {
          regex: pattern,
          replacement: "replaced",
        });
      }).toThrow(MultipleMatchesError);

      // Verify the error message still contains correct count despite optimization
      expect(() => {
        replaceStringWithRegex(largeString, {
          regex: pattern,
          replacement: "replaced",
        });
      }).toThrow(/Found 1000 matches for pattern/);
    });
  });

  describe("error handling", () => {
    it("should throw error for empty regex pattern", () => {
      expect(() => {
        replaceStringWithRegex("test", {
          regex: "",
          replacement: "replaced",
        });
      }).toThrow("Regex pattern cannot be empty");
    });

    it("should throw error for invalid regex pattern", () => {
      expect(() => {
        replaceStringWithRegex("test", {
          regex: "[invalid",
          replacement: "replaced",
        });
      }).toThrow("Invalid regex pattern:");
    });

    it("should handle regex with unmatched parentheses", () => {
      expect(() => {
        replaceStringWithRegex("test", {
          regex: "(unmatched",
          replacement: "replaced",
        });
      }).toThrow("Invalid regex pattern:");
    });

    it("should handle regex with invalid quantifiers", () => {
      expect(() => {
        replaceStringWithRegex("test", {
          regex: "*invalid",
          replacement: "replaced",
        });
      }).toThrow("Invalid regex pattern:");
    });
  });

  describe("edge cases", () => {
    it("should handle empty input string", () => {
      const result = replaceStringWithRegex("", {
        regex: "anything",
        replacement: "something",
      });
      expect(result).toBe("");
    });

    it("should handle very long strings", () => {
      const longString = "a".repeat(10000) + "target" + "b".repeat(10000);
      const result = replaceStringWithRegex(longString, {
        regex: "target",
        replacement: "replaced",
      });
      expect(result).toBe("a".repeat(10000) + "replaced" + "b".repeat(10000));
    });

    it("should handle unicode characters", () => {
      const result = replaceStringWithRegex("Hello 🌍", {
        regex: "🌍",
        replacement: "🌎",
      });
      expect(result).toBe("Hello 🌎");
    });

    it("should handle regex with word boundaries", () => {
      const result = replaceStringWithRegex("cat concatenate", {
        regex: "\\bcat\\b",
        replacement: "dog",
      });
      expect(result).toBe("dog concatenate");
    });

    it("should handle case-sensitive matching", () => {
      const result = replaceStringWithRegex("Hello HELLO hello", {
        regex: "hello",
        replacement: "hi",
        allowMultipleOccurrences: true,
      });
      expect(result).toBe("Hello HELLO hi");
    });
  });

  describe("real-world scenarios", () => {
    it("should replace function declarations", () => {
      const code = "function calculate(a, b) { return a + b; }";
      const result = replaceStringWithRegex(code, {
        regex: "function (\\w+)\\(([^)]*)\\)",
        replacement: "const $1 = ($2) =>",
      });
      expect(result).toBe("const calculate = (a, b) => { return a + b; }");
    });

    it("should replace import statements", () => {
      const code = 'import { foo } from "./bar";';
      const result = replaceStringWithRegex(code, {
        regex: 'import \\{ ([^}]+) \\} from "([^"]+)";',
        replacement: 'const { $1 } = require("$2");',
      });
      expect(result).toBe('const { foo } = require("./bar");');
    });

    it("should replace console.log with custom logger", () => {
      const code = 'console.log("debug info"); console.log("more info");';
      const result = replaceStringWithRegex(code, {
        regex: "console\\.log",
        replacement: "logger.debug",
        allowMultipleOccurrences: true,
      });
      expect(result).toBe(
        'logger.debug("debug info"); logger.debug("more info");',
      );
    });

    it("should replace CSS class names", () => {
      const css =
        ".old-class { color: red; } .another-old-class { font-size: 16px; }";
      const result = replaceStringWithRegex(css, {
        regex: "\\.old-class\\b",
        replacement: ".new-class",
        allowMultipleOccurrences: true,
      });
      expect(result).toBe(
        ".new-class { color: red; } .another-old-class { font-size: 16px; }",
      );
    });

    it("should handle complex markdown replacements", () => {
      const markdown = "# Heading\n\n## Subheading\n\nSome text";
      const result = replaceStringWithRegex(markdown, {
        regex: "^## (.+)$",
        replacement: "### $1",
      });
      expect(result).toBe("# Heading\n\n### Subheading\n\nSome text");
    });
  });

  describe("type checking", () => {
    it("should accept valid ReplaceStringOptions", () => {
      const options: ReplaceStringOptions = {
        regex: "test",
        replacement: "replaced",
        allowMultipleOccurrences: false,
      };
      const result = replaceStringWithRegex("test string", options);
      expect(result).toBe("replaced string");
    });

    it("should work with minimal options", () => {
      const options: ReplaceStringOptions = {
        regex: "test",
        replacement: "replaced",
      };
      const result = replaceStringWithRegex("test string", options);
      expect(result).toBe("replaced string");
    });
  });
});
