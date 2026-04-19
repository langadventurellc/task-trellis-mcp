import { escapeHtml } from "../escapeHtml";

describe("escapeHtml", () => {
  it("escapes all five special HTML characters", () => {
    expect(escapeHtml("& < > \" '")).toBe("&amp; &lt; &gt; &quot; &#39;");
  });
});
