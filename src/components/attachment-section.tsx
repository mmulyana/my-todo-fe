import { useRef, useState } from "react";
import {
  File,
  File as FileIcon,
  Link as LinkIcon,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useCreateAttachment,
  useDeleteAttachment,
  useUploadAttachment,
} from "../hooks/useTodos";
import { resolveAttachmentUrl } from "../api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Attachment } from "../types";

type AttachmentSectionProps = ({ todoId: string } | { projectId: string }) & {
  attachments: Attachment[];
  tabbed?: boolean;
  view?: "links" | "files";
};

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(dot + 1, dot + 5) : "";
}

function filenameFromUrl(url: string): string {
  try {
    const { pathname } = new URL(url);
    const last = pathname.split("/").filter(Boolean).pop();
    return last || url;
  } catch {
    return url;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function AttachmentSection({
  attachments,
  tabbed = false,
  view,
  ...target
}: AttachmentSectionProps) {
  const [url, setUrl] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const createAttachment = useCreateAttachment();
  const deleteAttachment = useDeleteAttachment();
  const uploadAttachment = useUploadAttachment();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    createAttachment.mutate({
      ...target,
      url: trimmed,
      filename: filenameFromUrl(trimmed),
      type: "LINK",
    });
    setUrl("");
  };

  const upload = (file: File | undefined) => {
    if (file) uploadAttachment.mutate({ file, ...target });
  };

  const fileInputEl = (
    <input
      ref={fileInput}
      type="file"
      className="sr-only"
      onChange={(event) => {
        upload(event.target.files?.[0]);
        event.target.value = "";
      }}
    />
  );

  const linkForm = (
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
  );

  if (tabbed || view) {
    const links = attachments.filter((a) => a.type === "LINK");
    const files = attachments.filter((a) => a.type !== "LINK");

    const linksContent = (
      <div className="flex flex-col gap-2">
        {links.map((attachment) => (
          <LinkCard
            key={attachment.id}
            attachment={attachment}
            onDelete={() => deleteAttachment.mutate(attachment.id)}
          />
        ))}

        {createAttachment.isPending && (
          <div className="flex items-center gap-2.5 text-sm text-muted">
            <div className="shrink-0 w-5.5 flex justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <span>Fetching preview...</span>
          </div>
        )}

        {linkForm}
      </div>
    );

    const filesContent = (
      <>
        <div className="grid grid-cols-3 gap-2">
          {files.map((attachment) => (
            <FileTile
              key={attachment.id}
              attachment={attachment}
              onDelete={() => deleteAttachment.mutate(attachment.id)}
            />
          ))}

          {uploadAttachment.isPending && (
            <div className="grid aspect-square place-items-center rounded-xl border border-line bg-raised/60 text-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploadAttachment.isPending}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-muted hover:border-muted hover:text-fg disabled:cursor-wait disabled:opacity-60 transition-colors cursor-pointer"
          >
            <Plus size={18} />
            <span className="text-xs">Add file</span>
          </button>
        </div>
        {fileInputEl}
      </>
    );

    if (view === "links") return linksContent;
    if (view === "files") return filesContent;

    return (
      <Tabs defaultValue="links">
        <TabsList className="w-fit bg-tint/5 rounded-lg">
          <TabsTrigger value="links" className="gap-1">
            <LinkIcon size={12} />
            Links
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1">
            <File size={12} />
            Files
          </TabsTrigger>
        </TabsList>
        <TabsContent value="links">{linksContent}</TabsContent>
        <TabsContent value="files">{filesContent}</TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {!!attachments.length && (
        <p className="text-sm text-fg/70 font-medium">Attachments</p>
      )}

      {attachments.map((attachment) =>
        attachment.type === "LINK" ? (
          <LinkCard
            key={attachment.id}
            attachment={attachment}
            onDelete={() => deleteAttachment.mutate(attachment.id)}
          />
        ) : (
          <AttachmentRow
            key={attachment.id}
            attachment={attachment}
            onDelete={() => deleteAttachment.mutate(attachment.id)}
          />
        ),
      )}

      {(createAttachment.isPending || uploadAttachment.isPending) && (
        <div className="flex items-center gap-2.5 text-sm text-muted">
          <div className="shrink-0 w-5.5 flex justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
          <span>
            {uploadAttachment.isPending
              ? "Uploading attachment..."
              : "Fetching preview..."}
          </span>
        </div>
      )}

      {linkForm}

      {fileInputEl}
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploadAttachment.isPending}
        className="flex items-center gap-2 py-1 text-sm text-muted hover:text-fg disabled:cursor-wait disabled:opacity-60 transition-colors cursor-pointer"
      >
        <span className="shrink-0 w-5.5 flex justify-center">
          <Paperclip size={16} />
        </span>
        <span>Add file</span>
      </button>
    </div>
  );
}

type AttachmentRowProps = {
  attachment: Attachment;
  onDelete: () => void;
};

/** Rich card for links: thumbnail, title, description, source. */
function LinkCard({ attachment, onDelete }: AttachmentRowProps) {
  const href = attachment.url;
  const title = attachment.title || attachment.filename || hostOf(href);
  const source = attachment.siteName || hostOf(href);

  return (
    <div className="group/att relative flex overflow-hidden rounded-xl border border-line bg-raised/60 hover:bg-raised transition-colors">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="flex flex-1 min-w-0 gap-3 p-2.5"
      >
        {attachment.image ? (
          <img
            src={attachment.image}
            alt=""
            loading="lazy"
            className="w-20 h-20 shrink-0 rounded-lg object-cover bg-tint/5"
          />
        ) : (
          <span className="grid place-items-center w-20 h-20 shrink-0 rounded-lg bg-tint/5 text-muted">
            <LinkIcon className="w-5 h-5" />
          </span>
        )}

        <div className="flex flex-col min-w-0 flex-1 gap-1 py-0.5">
          <p className="text-sm font-medium text-fg line-clamp-2">{title}</p>
          {attachment.description && (
            <p className="text-xs text-muted line-clamp-2">
              {attachment.description}
            </p>
          )}
          <span className="mt-auto flex items-center gap-1.5 text-[11px] text-muted">
            {attachment.favicon && (
              <img
                src={attachment.favicon}
                alt=""
                loading="lazy"
                className="w-3.5 h-3.5 rounded-sm object-contain"
              />
            )}
            <span className="truncate">{source}</span>
          </span>
        </div>
      </a>

      <button
        type="button"
        onClick={onDelete}
        className="absolute right-1.5 top-1.5 opacity-0 group-hover/att:opacity-100 p-1 rounded bg-surface/80 text-muted hover:text-danger transition-opacity cursor-pointer"
        aria-label="Remove attachment"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/** Square tile for uploaded files: image preview, or an icon with the extension. */
function FileTile({ attachment, onDelete }: AttachmentRowProps) {
  const href = resolveAttachmentUrl(attachment.url);
  const ext = extensionOf(attachment.filename);

  return (
    <div className="group/att relative flex min-w-0 flex-col gap-1">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="block aspect-square overflow-hidden rounded-xl border border-line bg-raised/60 hover:bg-raised transition-colors"
      >
        {attachment.type === "IMAGE" ? (
          <img
            src={href}
            alt={attachment.filename}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-1 text-muted">
            <FileIcon className="w-6 h-6" />
            {ext && (
              <span className="text-[10px] font-medium uppercase">{ext}</span>
            )}
          </span>
        )}
      </a>
      <p className="truncate text-xs text-fg/80" title={attachment.filename}>
        {attachment.filename}
      </p>

      <button
        type="button"
        onClick={onDelete}
        className="absolute right-1 top-1 opacity-0 group-hover/att:opacity-100 p-1 rounded bg-surface/80 text-muted hover:text-danger transition-opacity cursor-pointer"
        aria-label="Remove attachment"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

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
        className="opacity-0 group-hover/att:opacity-100 p-1 rounded hover:bg-tint/10 text-muted hover:text-danger transition-opacity cursor-pointer"
        aria-label="Remove attachment"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
