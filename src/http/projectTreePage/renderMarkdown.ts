import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,
  linkify: false,
  breaks: false,
  typographer: false,
});

md.disable(["autolink"]);

export function renderMarkdown(src: string): string {
  return md.render(src);
}
