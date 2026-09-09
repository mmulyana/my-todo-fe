export function mcpDesktopConfigSnippet(mcpUrl: string, token: string) {
  return JSON.stringify(
    {
      mcpServers: {
        "my-todo": {
          command: "npx",
          args: [
            "-y",
            "mcp-remote",
            mcpUrl,
            "--header",
            `Authorization: Bearer ${token}`,
          ],
        },
      },
    },
    null,
    2,
  );
}

export function mcpCliCommand(mcpUrl: string, token: string) {
  return `claude mcp add --transport http my-todo ${mcpUrl} --header "Authorization: Bearer ${token}"`;
}
