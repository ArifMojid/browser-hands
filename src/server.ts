import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { openPage, readPage, listElements, clickElement, fillElement } from "./browser.js";

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

// Tool 3: list_elements
server.registerTool(
  "list_elements",
  {
    title: "List elements",
    description: "List visible links, buttons and inputs on the page, each with a ref number to use with click_element or fill_element.",
    inputSchema: {
      limit: z.number().int().positive().optional().describe("Max elements to return (default 50)"),
    },
  },
  async ({ limit }) => {
    const result = await listElements(limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool 4: click_element
server.registerTool(
  "click_element",
  {
    title: "Click element",
    description: "Click an element using a ref number from list_elements.",
    inputSchema: { ref: z.number().int().describe("Ref number from list_elements") },
  },
  async ({ ref }) => {
    const result = await clickElement(ref);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool 5: fill_element
server.registerTool(
  "fill_element",
  {
    title: "Fill element",
    description: "Type text into an input using a ref number from list_elements.",
    inputSchema: {
      ref: z.number().int().describe("Ref number from list_elements"),
      value: z.string().describe("Text to type"),
    },
  },
  async ({ ref, value }) => {
    const result = await fillElement(ref, value);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Connect over stdio (how AI apps like Claude Desktop talk to local servers)
await server.connect(new StdioServerTransport());
console.error("browser-hands MCP server running");