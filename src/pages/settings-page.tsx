import { useState } from "react";
import { Check, Copy, KeyRound, Trash2 } from "lucide-react";
import { PageShell } from "../components/page-shell";
import { NewTokenModal } from "../components/new-token-modal";
import { Button } from "@/components/ui/button";
import { useApiTokens, useRevokeApiToken } from "../hooks/useApiTokens";
import { API_ORIGIN } from "../api";
import type { NewApiToken } from "../types";

const MCP_URL = `${API_ORIGIN}/api/mcp`;

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" /> Copied
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" /> Copy
        </>
      )}
    </Button>
  );
}

function mcpConfigSnippet(token: string) {
  return JSON.stringify(
    {
      mcpServers: {
        "my-todo": {
          command: "npx",
          args: ["-y", "mcp-remote", MCP_URL, "--header", `Authorization: Bearer ${token}`],
        },
      },
    },
    null,
    2,
  );
}

export default function SettingsPage() {
  const { data: tokens = [], isLoading } = useApiTokens();
  const revokeToken = useRevokeApiToken();
  const [modalOpen, setModalOpen] = useState(false);
  const [revealedToken, setRevealedToken] = useState<NewApiToken | null>(null);

  return (
    <PageShell
      title="Settings"
      actions={
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <KeyRound className="w-3.5 h-3.5" /> New token
        </Button>
      }
    >
      <div className="flex flex-col gap-6 px-3.5">
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-white">MCP Access</h2>
          <p className="text-xs text-muted leading-relaxed max-w-2xl">
            Personal access tokens let external MCP clients - Claude Desktop, Claude Code -
            read and manage your todos on your behalf. Each token acts as you; revoke one the
            moment you stop using the client it was made for.
          </p>
        </section>

        {revealedToken && (
          <section className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-white">
                  "{revealedToken.name}" created
                </p>
                <p className="text-xs text-muted">
                  Copy this now - it won't be shown again. If you lose it, revoke it and
                  create a new one.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevealedToken(null)}
                className="text-xs text-muted hover:text-fg shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate rounded-md border border-line bg-raised px-3 py-2 text-xs font-mono text-fg">
                {revealedToken.token}
              </code>
              <CopyButton text={revealedToken.token} />
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted">
                Claude Desktop config (claude_desktop_config.json)
              </p>
              <div className="flex items-start gap-2">
                <pre className="flex-1 min-w-0 overflow-x-auto rounded-md border border-line bg-raised px-3 py-2 text-xs font-mono text-fg whitespace-pre">
                  {mcpConfigSnippet(revealedToken.token)}
                </pre>
                <CopyButton text={mcpConfigSnippet(revealedToken.token)} />
              </div>
              <p className="text-[11px] text-muted">
                For Claude Code:{" "}
                <code className="text-fg">
                  claude mcp add --transport http my-todo {MCP_URL} --header "Authorization:
                  Bearer {revealedToken.token}"
                </code>
              </p>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted">Active tokens</h3>

          {isLoading && <p className="text-xs text-muted">Loading...</p>}

          {!isLoading && tokens.length === 0 && (
            <p className="text-xs text-muted">No tokens yet. Create one to connect an MCP client.</p>
          )}

          {tokens.length > 0 && (
            <div className="flex flex-col rounded-xl border border-line overflow-hidden">
              {tokens.map((token, i) => (
                <div
                  key={token.id}
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span
                      className={`text-sm truncate ${token.revokedAt ? "text-muted line-through" : "text-fg"}`}
                    >
                      {token.name}
                    </span>
                    <span className="text-xs text-muted font-mono">
                      {token.prefix}... - created {formatDate(token.createdAt)} - last used{" "}
                      {formatDate(token.lastUsedAt)}
                      {token.expiresAt ? ` - expires ${formatDate(token.expiresAt)}` : ""}
                    </span>
                  </div>
                  {token.revokedAt ? (
                    <span className="text-xs text-muted shrink-0">
                      Revoked {formatDate(token.revokedAt)}
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={revokeToken.isPending}
                      onClick={() => {
                        if (confirm(`Revoke "${token.name}"? Any client using it will stop working.`)) {
                          revokeToken.mutate(token.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <NewTokenModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(token) => setRevealedToken(token)}
      />
    </PageShell>
  );
}
