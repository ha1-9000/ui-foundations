# Figma MCP Export (Local)

1) Open the Figma desktop app.
2) Enable the Dev Mode MCP Server.
3) Confirm the endpoint is listening at http://127.0.0.1:3845/mcp.
4) In your editor (VS Code/Codex), ensure the MCP server "figma" is connected.
5) Select a node (page/frame) in Figma to provide context.
6) Run the export:

   npm run mcp:export

Notes:
- This uses the local MCP server, not the Figma REST API.
- If the export fails, verify the MCP server is enabled and reachable.
