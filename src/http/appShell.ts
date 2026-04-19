import { escapeHtml } from "./escapeHtml";

/** Returns a full HTML document with both the stylesheet link and HTMX script tag. */
export function appShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="/_styles.css">
<script src="/_htmx.js"></script>
</head>
<body>
${body}
</body>
</html>`;
}
