import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { openPage, readPage } from "./browser.js";

// Create the server and give it a name and version
const server = new McpServer({ name: "browser-hands", version: "0.1.0" });

// Tool 1: open_page
server.registerTool(
  "open_page",
  {
    title: "Open page",
    description: "Open a URL in the browser. Returns the final URL and page title.",
    inputSchema: { url: z.string().url().describe("Full URL, e.g. https://example.com") },
  },
  async ({ url }) => {
    const result = await openPage(url);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool 2: read_page
server.registerTool(
  "read_page",
  {
    title: "Read page",
    description: "Read the current page as clean text so an AI can understand it.",
    inputSchema: {
      maxChars: z.number().int().positive().optional().describe("Max characters to return (default 5000)"),
    },
  },
  async ({ maxChars }) => {
    const result = await readPage(maxChars);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Connect over stdio (how AI apps like Claude Desktop talk to local servers)
await server.connect(new StdioServerTransport());
console.error("browser-hands MCP server running");