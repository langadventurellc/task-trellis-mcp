import { resolveProjectKey } from "../configuration";

export const getUiInfoTool = {
  name: "get_ui_info",
  description: `Returns the URL and port of the Task Trellis browser UI.

Use when the user asks about the Task Trellis UI, where to view issues in a browser, or asks you to open the UI.`,
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
} as const;

export function handleGetUiInfo(projectDir: string): {
  content: { type: string; text: string }[];
} {
  const port = parseInt(process.env.TRELLIS_UI_PORT ?? "3717", 10);
  const url = `http://127.0.0.1:${port}`;
  const projectKey = resolveProjectKey(projectDir);
  const projectUrl = `${url}/projects/${projectKey}`;
  return {
    content: [
      { type: "text", text: JSON.stringify({ url, port, projectUrl }) },
    ],
  };
}
