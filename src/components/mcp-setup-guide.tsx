import { useState } from "react";
import { CopyButton } from "./copy-button";
import { mcpCliCommand, mcpDesktopConfigSnippet } from "@/lib/mcp-config";
import { cn } from "@/lib/utils";

type McpSetupGuideProps = {
  mcpUrl: string;
  token: string | null;
};

const PLACEHOLDER_TOKEN = "<your-token>";

type Tab = "desktop" | "cli";

const TABS: { id: Tab; label: string }[] = [
  { id: "desktop", label: "Claude Desktop" },
  { id: "cli", label: "Claude Code" },
];

export function McpSetupGuide({ mcpUrl, token }: McpSetupGuideProps) {
  const [tab, setTab] = useState<Tab>("desktop");
  const effectiveToken = token ?? PLACEHOLDER_TOKEN;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-fg">How to connect</h3>
        <p className="text-sm text-muted leading-relaxed max-w-3xl">
          Pick the client you use. You'll need a token from above - the steps
          below use{" "}
          {token ? "your latest one" : "a placeholder until you create one"}.
        </p>
      </div>

      <div className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
              tab === t.id
                ? "border-accent text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "desktop" ? (
        <ol className="flex flex-col gap-3 text-sm text-fg/90">
          <li className="flex flex-col gap-1">
            <span className="text-muted">1. Open the config file</span>
            <span className="font-mono text-[11px] text-fg">
              Mac:{" "}
              <span className="text-muted">
                ~/Library/Application Support/Claude/claude_desktop_config.json
              </span>
              <br />
              Windows:{" "}
              <span className="text-muted">
                %APPDATA%\Claude\claude_desktop_config.json
              </span>
            </span>
            <span className="text-muted">
              Create the file (and folder) if it doesn't exist yet.
            </span>
          </li>

          <li className="flex flex-col gap-1.5">
            <span className="text-muted">2. Add this to it</span>
            <div className="flex items-start gap-2">
              <pre className="flex-1 min-w-0 overflow-x-auto rounded-md border border-line bg-raised px-3 py-2 text-[11px] font-mono text-fg whitespace-pre">
                {mcpDesktopConfigSnippet(mcpUrl, effectiveToken)}
              </pre>
              <CopyButton
                text={mcpDesktopConfigSnippet(mcpUrl, effectiveToken)}
              />
            </div>
            {!token && (
              <span className="text-muted">
                Replace {PLACEHOLDER_TOKEN} with a real one from "New token"
                above.
              </span>
            )}
          </li>

          <li>
            <span className="text-muted">
              3. Quit Claude Desktop completely and reopen it - closing the
              window isn't enough.
            </span>
          </li>

          <li>
            <span className="text-muted">
              4. Check the tools/plug icon in the chat box - "my-todo" should
              show up with 8 tools if it connected.
            </span>
          </li>
        </ol>
      ) : (
        <ol className="flex flex-col gap-3 text-xs text-fg/90">
          <li>
            <span className="text-muted">
              1. Create a token above if you haven't, and copy it.
            </span>
          </li>

          <li className="flex flex-col gap-1.5">
            <span className="text-muted">2. Run this in your terminal</span>
            <div className="flex items-start gap-2">
              <code className="flex-1 min-w-0 overflow-x-auto rounded-md border border-line bg-raised px-3 py-2 text-[11px] font-mono text-fg whitespace-pre">
                {mcpCliCommand(mcpUrl, effectiveToken)}
              </code>
              <CopyButton text={mcpCliCommand(mcpUrl, effectiveToken)} />
            </div>
          </li>

          <li>
            <span className="text-muted">
              3. Verify with <code className="text-fg">claude mcp list</code> -
              "my-todo" should show as connected.
            </span>
          </li>
        </ol>
      )}

      <p className="text-sm text-muted border-t border-line pt-3">
        Getting a 401 or the tool doesn't show up? The token is likely wrong,
        revoked, or expired - create a new one above and swap it in. Revoke a
        token any time from the list below to disconnect that client.
      </p>
    </section>
  );
}
