import { escapeHtml } from "../escapeHtml";
import { page } from "../layout";

describe("escapeHtml", () => {
  it("escapes all five special HTML characters", () => {
    expect(escapeHtml("& < > \" '")).toBe("&amp; &lt; &gt; &quot; &#39;");
  });
});

describe("page", () => {
  it("includes the htmx script tag", () => {
    const output = page("Title", "<p>body</p>");
    expect(output).toContain('<script src="/_htmx.js">');
  });

  it("includes the provided body", () => {
    const output = page("Title", "<h1>hello</h1>");
    expect(output).toContain("<h1>hello</h1>");
  });
});
