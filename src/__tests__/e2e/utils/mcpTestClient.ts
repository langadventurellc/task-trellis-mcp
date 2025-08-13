import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  ListToolsResultSchema,
  CallToolResultSchema,
} from "@modelcontextprotocol/sdk/types.js";

export class McpTestClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connected: boolean = false;
  private projectRoot: string;
  private autoCompleteParent?: boolean;

  constructor(projectRoot: string, autoCompleteParent?: boolean) {
    this.projectRoot = projectRoot;
    this.autoCompleteParent = autoCompleteParent;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    // Create transport that will spawn the server process
    const args = [
      "dist/server.js",
      "--mode",
      "local",
      "--projectRootFolder",
      this.projectRoot,
    ];

    if (this.autoCompleteParent) {
      args.push("--auto-complete-parent");
    }

    this.transport = new StdioClientTransport({
      command: "node",
      args,
    });

    // Create and connect client
    this.client = new Client(
      {
        name: "test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
    );

    await this.client.connect(this.transport);
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    if (this.client) {
      await this.client.close();
      this.client = null;
    }

    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }

    this.connected = false;
  }

  async listTools(): Promise<any> {
    if (!this.client) {
      throw new Error("Client not connected");
    }

    // Request with proper result schema
    const response = await this.client.request(
      { method: "tools/list" },
      ListToolsResultSchema,
    );

    return response;
  }

  async callTool(name: string, args: any = {}): Promise<any> {
    if (!this.client) {
      throw new Error("Client not connected");
    }

    // Request with proper result schema
    const response = await this.client.request(
      {
        method: "tools/call",
        params: {
          name,
          arguments: args,
        },
      },
      CallToolResultSchema,
    );

    return response;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
