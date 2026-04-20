import { resolveProjectKey } from "../../configuration";
import { handleGetUiInfo } from "../getUiInfoTool";

describe("getUiInfoTool", () => {
  const testProjectDir = "/test/project";

  describe("handleGetUiInfo", () => {
    let originalPort: string | undefined;

    beforeEach(() => {
      originalPort = process.env.TRELLIS_UI_PORT;
      delete process.env.TRELLIS_UI_PORT;
    });

    afterEach(() => {
      if (originalPort === undefined) {
        delete process.env.TRELLIS_UI_PORT;
      } else {
        process.env.TRELLIS_UI_PORT = originalPort;
      }
    });

    it("uses default port 3717 when TRELLIS_UI_PORT is unset", () => {
      const result = handleGetUiInfo(testProjectDir);
      const data = JSON.parse(result.content[0].text) as {
        url: string;
        port: number;
        projectUrl: string;
      };

      expect(data.port).toBe(3717);
      expect(data.url).toBe("http://127.0.0.1:3717");
      expect(data.projectUrl).toMatch(
        /^http:\/\/127\.0\.0\.1:3717\/projects\//,
      );
    });

    it("uses custom port when TRELLIS_UI_PORT is set", () => {
      process.env.TRELLIS_UI_PORT = "4000";

      const result = handleGetUiInfo(testProjectDir);
      const data = JSON.parse(result.content[0].text) as {
        url: string;
        port: number;
        projectUrl: string;
      };

      expect(data.port).toBe(4000);
      expect(data.url).toBe("http://127.0.0.1:4000");
      expect(data.projectUrl).toMatch(
        /^http:\/\/127\.0\.0\.1:4000\/projects\//,
      );
    });

    it("projectUrl contains the 12-char hex project key", () => {
      const result = handleGetUiInfo(testProjectDir);
      const data = JSON.parse(result.content[0].text) as {
        url: string;
        port: number;
        projectUrl: string;
      };

      const expectedKey = resolveProjectKey(testProjectDir);
      expect(expectedKey).toMatch(/^[0-9a-f]{12}$/);
      expect(data.projectUrl).toBe(
        `http://127.0.0.1:3717/projects/${expectedKey}`,
      );
    });
  });
});
