import { renderMarkdown } from "../renderMarkdown";

it("renders headings", () => {
  const html = renderMarkdown("# Title\n\n## Sub");
  expect(html).toContain("<h1>Title</h1>");
  expect(html).toContain("<h2>Sub</h2>");
});

it("renders unordered and ordered lists", () => {
  const html = renderMarkdown("- a\n- b\n\n1. one\n2. two");
  expect(html).toContain("<ul>");
  expect(html).toContain("<li>a</li>");
  expect(html).toContain("<ol>");
  expect(html).toContain("<li>one</li>");
});

it("renders fenced code blocks and inline code", () => {
  const html = renderMarkdown("Use `foo` here\n\n```\nconst x = 1;\n```");
  expect(html).toContain("<code>foo</code>");
  expect(html).toContain("<pre>");
  expect(html).toContain("const x = 1;");
});

it("renders inline markdown links", () => {
  const html = renderMarkdown("[click](https://example.com)");
  expect(html).toContain('<a href="https://example.com">click</a>');
});

it("renders tables", () => {
  const html = renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
  expect(html).toContain("<table>");
  expect(html).toContain("<th>a</th>");
  expect(html).toContain("<td>1</td>");
});

it("does not autolink bare URLs", () => {
  const html = renderMarkdown("Visit https://example.com today");
  expect(html).not.toContain("<a ");
  expect(html).toContain("https://example.com");
});

it("does not autolink bracketed URLs", () => {
  const html = renderMarkdown("See <https://example.com>");
  expect(html).not.toContain("<a ");
});

it("escapes raw HTML instead of passing it through", () => {
  const html = renderMarkdown('<script>alert("xss")</script>\n\nhi');
  expect(html).not.toContain("<script>");
  expect(html).toContain("&lt;script&gt;");
});

it("returns empty string for empty input", () => {
  expect(renderMarkdown("")).toBe("");
});
