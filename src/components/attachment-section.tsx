import { useState } from "react";
import { Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { useCreateAttachment, useDeleteAttachment } from "../hooks/useTodos";
import { resolveAttachmentUrl } from "../api";
import type { Attachment } from "../types";

type AttachmentSectionProps = {
  todoId: string;
  attachments: Attachment[];
};

function filenameFromUrl(url: string): string {
  try {
    const { pathname } = new URL(url);
    const last = pathname.split("/").filter(Boolean).pop();
    return last || url;
  } catch {
    return url;
  }
}

export function AttachmentSection({
  todoId,
  attachments,
}: AttachmentSectionProps) {
  const [url, setUrl] = useState("");

  const createAttachment = useCreateAttachment();
  const deleteAttachment = useDeleteAttachment();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    createAttachment.mutate({
      todoId,
      url: trimmed,
      filename: filenameFromUrl(trimmed),
      type: "LINK",
    });
    setUrl("");
  };

  return (
    <div className="flex flex-col gap-2">
      {!!attachments.length && <p className="text-sm text-fg/50">Attachments</p>}

      {attachments.map((attachment) => (
        <AttachmentRow
          key={attachment.id}
          attachment={attachment}
          onDelete={() => deleteAttachment.mutate(attachment.id)}
        />
      ))}

      <form className="flex items-center gap-2 text-muted" onSubmit={submit}>
        <div className="shrink-0 w-5.5 flex justify-center">
          <Plus className="shrink-0" size={16} />
        </div>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Add attachment link"
          className="flex-1 min-w-0 border-none bg-transparent text-sm text-fg outline-none placeholder:text-muted"
        />
      </form>
    </div>
  );
}

type AttachmentRowProps = {
  attachment: Attachment;
  onDelete: () => void;
};

function AttachmentRow({ attachment, onDelete }: AttachmentRowProps) {
  const href = resolveAttachmentUrl(attachment.url);

  return (
    <div className="group/att flex items-center gap-2.5 rounded-lg transition-colors">
      {attachment.type === "IMAGE" ? (
        <img
          src={href}
          alt={attachment.filename}
          className="w-5.5 h-5.5 rounded-md object-cover shrink-0 bg-raised"
        />
      ) : (
        <span className="grid place-items-center w-5.5 h-5.5 shrink-0 text-muted">
          <LinkIcon className="w-4 h-4" />
        </span>
      )}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="flex-1 min-w-0 truncate py-1.5 text-sm text-fg/80 hover:underline"
      >
        {attachment.filename}
      </a>
      <button
        type="button"
        onClick={onDelete}
        className="opacity-0 group-hover/att:opacity-100 p-1 rounded hover:bg-white/10 text-muted hover:text-red-400 transition-opacity cursor-pointer"
        aria-label="Remove attachment"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
