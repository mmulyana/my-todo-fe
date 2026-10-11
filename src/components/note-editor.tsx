import { useEffect, useRef, useState } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import {
  Bold,
  File as FileIcon,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  Loader2,
  Paperclip,
  Table as TableIcon,
  Upload,
} from "lucide-react";
import { AttachmentNode } from "../lib/attachment-node";
import { NoteAttachmentsContext } from "../lib/note-attachments-context";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { useCreateAttachment, useUploadAttachment } from "../hooks/useTodos";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Attachment, DocumentContent } from "../types";

type NoteEditorProps = {
  todoId: string;
  noteJson: DocumentContent | undefined;
  attachments: Attachment[];
  onChange: (doc: DocumentContent, signal: AbortSignal) => void;
};

const SAVE_DELAY = 400;

// note: harus sama dengan konfigurasi BE (src/common/note-markdown.ts) supaya JSON <-> Markdown tidak lossy
const extensions = [
  StarterKit.configure({ underline: false, heading: { levels: [1, 2, 3] } }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Table,
  TableRow,
  TableHeader,
  TableCell,
  AttachmentNode,
  Placeholder.configure({ placeholder: "Add note..." }),
];

const toolbarButtonClass =
  "flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-tint/10 hover:text-fg";

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // note: mousedown dicegah supaya editor tidak kehilangan selection saat tombol diklik
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(toolbarButtonClass, active && "bg-tint/10 text-fg")}
    >
      {children}
    </button>
  );
}

function LinkPopover({
  editor,
  todoId,
  attachments,
  active,
}: {
  editor: Editor;
  todoId: string;
  attachments: Attachment[];
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [addToLinks, setAddToLinks] = useState(true);
  const createAttachment = useCreateAttachment();

  const onOpenChange = (next: boolean) => {
    if (next) {
      setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    }
    setOpen(next);
  };

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const href = url.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href === "") {
      chain.unsetLink().run();
    } else if (editor.state.selection.empty && !active) {
      // note: tanpa teks terpilih, URL-nya sendiri jadi teks link
      chain
        .insertContent({
          type: "text",
          text: href,
          marks: [{ type: "link", attrs: { href } }],
        })
        .run();
    } else {
      chain.setLink({ href }).run();
    }
    // note: hyperlink di teks saja tidak membuat attachment, jadi URL didaftarkan juga ke links todo kecuali sudah ada
    if (href !== "" && addToLinks && !attachments.some((a) => a.url === href)) {
      createAttachment.mutate({
        todoId,
        url: href,
        filename: "",
        type: "LINK",
      });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Link"
          aria-label="Link"
          onMouseDown={(e) => e.preventDefault()}
          className={cn(toolbarButtonClass, active && "bg-tint/10 text-fg")}
        >
          <LinkIcon size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <form onSubmit={apply} className="flex flex-col gap-2">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-line bg-raised px-2 py-1 text-xs outline-none focus:border-accent"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input
              type="checkbox"
              checked={addToLinks}
              onChange={(e) => setAddToLinks(e.target.checked)}
            />
            Also add to todo links
          </label>
          <div className="flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              disabled={!active}
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .unsetLink()
                  .run();
                setOpen(false);
              }}
              className="text-muted hover:text-fg disabled:opacity-40"
            >
              Remove link
            </button>
            <button
              type="submit"
              className="rounded-md bg-accent px-2 py-1 text-white"
            >
              Apply
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function AttachmentPopover({
  editor,
  todoId,
  attachments,
}: {
  editor: Editor;
  todoId: string;
  attachments: Attachment[];
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const createAttachment = useCreateAttachment();
  const uploadAttachment = useUploadAttachment();
  const pending = createAttachment.isPending || uploadAttachment.isPending;
  const errorMessage =
    createAttachment.error?.message ?? uploadAttachment.error?.message;

  const insert = (attachmentId: string) => {
    editor
      .chain()
      .focus()
      .insertContent({ type: "attachment", attrs: { attachmentId } })
      .run();
    setOpen(false);
  };

  const attachLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || pending) return;
    try {
      // note: filename kosong supaya server memakai title preview halaman
      const attachment = await createAttachment.mutateAsync({
        todoId,
        url: trimmed,
        filename: "",
        type: "LINK",
      });
      setUrl("");
      insert(attachment.id);
    } catch (err) {
      // note: input tetap berisi URL supaya bisa dicoba lagi, pesan error tampil lewat createAttachment.error
      console.error("note attach link failed", err);
    }
  };

  // note: upload masuk ke attachment todo lewat endpoint yang sama dengan section Attachments, lalu disisipkan
  const upload = async (file: File | undefined) => {
    if (!file || pending) return;
    try {
      const attachment = await uploadAttachment.mutateAsync({ file, todoId });
      insert(attachment.id);
    } catch (err) {
      // note: pesan error tampil di popover lewat uploadAttachment.error
      console.error("note upload failed", err);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Insert attachment"
          aria-label="Insert attachment"
          onMouseDown={(e) => e.preventDefault()}
          className={toolbarButtonClass}
        >
          <Paperclip size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1">
        <div className="max-h-48 overflow-y-auto">
          {attachments.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted">No attachments yet</p>
          ) : (
            attachments.map((attachment) => (
              <button
                key={attachment.id}
                type="button"
                onClick={() => insert(attachment.id)}
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-xs hover:bg-tint/10"
              >
                <span className="mr-2 shrink-0 text-muted">
                  {attachment.type === "LINK" ? (
                    <LinkIcon size={12} />
                  ) : attachment.type === "IMAGE" ? (
                    <ImageIcon size={12} />
                  ) : (
                    <FileIcon size={12} />
                  )}
                </span>
                <span className="truncate">
                  {attachment.title || attachment.filename}
                </span>
              </button>
            ))
          )}
        </div>
        <form
          onSubmit={attachLink}
          className="mt-1 flex items-center gap-2 border-t border-line px-1 pt-1.5"
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a link to attach and insert"
            className="min-w-0 flex-1 bg-transparent px-1 py-1 text-xs outline-none placeholder:text-muted"
          />
          {pending && (
            <Loader2 size={14} className="shrink-0 animate-spin text-muted" />
          )}
        </form>
        <input
          ref={fileInput}
          type="file"
          className="sr-only"
          onChange={(event) => {
            void upload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => fileInput.current?.click()}
          className="mt-1 flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-muted hover:bg-tint/10 hover:text-fg disabled:opacity-50"
        >
          <Upload size={12} />
          Upload a file and insert
        </button>
        {errorMessage && (
          <p className="px-2 py-1 text-[11px] text-danger">{errorMessage}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function Toolbar({
  editor,
  todoId,
  attachments,
}: {
  editor: Editor;
  todoId: string;
  attachments: Attachment[];
}) {
  // note: useEditor tidak re-render pada perubahan selection, jadi status tombol aktif dibaca lewat useEditorState
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      heading: e.isActive("heading", { level: 2 }),
      bulletList: e.isActive("bulletList"),
      taskList: e.isActive("taskList"),
      link: e.isActive("link"),
      table: e.isActive("table"),
    }),
  });

  return (
    <div className="flex items-center gap-0.5 border-b border-line px-1.5 py-1">
      <ToolbarButton
        label="Bold"
        active={active.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={active.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Heading"
        active={active.heading}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        active={active.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Task list"
        active={active.taskList}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListChecks size={14} />
      </ToolbarButton>
      <LinkPopover
        editor={editor}
        todoId={todoId}
        attachments={attachments}
        active={active.link}
      />
      <ToolbarButton
        label="Table"
        active={active.table}
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
      >
        <TableIcon size={14} />
      </ToolbarButton>
      <AttachmentPopover
        editor={editor}
        todoId={todoId}
        attachments={attachments}
      />
    </div>
  );
}

export function NoteEditor({
  todoId,
  noteJson,
  attachments,
  onChange,
}: NoteEditorProps) {
  // note: JSON terakhir yang dikirim editor; kalau server mengembalikan yang sama, editor tidak di-reset (kursor aman)
  const lastEmittedRef = useRef<string | null>(null);

  const [save] = useDebouncedCallback(
    (doc: DocumentContent, signal: AbortSignal) => onChange(doc, signal),
    SAVE_DELAY,
  );

  const editor = useEditor({
    extensions,
    content: (noteJson ?? null) as JSONContent | null,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-48 px-3 py-2.5 outline-none text-sm leading-relaxed",
      },
    },
    onUpdate: ({ editor: e }) => {
      const doc = e.isEmpty ? null : (e.getJSON() as DocumentContent);
      lastEmittedRef.current = JSON.stringify(doc);
      save(doc);
    },
  });

  // note: perubahan dari luar (agent lewat MCP) hanya dimuat saat editor tidak sedang dipakai mengetik
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const incoming = JSON.stringify(noteJson ?? null);
    if (incoming === lastEmittedRef.current) return;
    const current = JSON.stringify(editor.isEmpty ? null : editor.getJSON());
    if (incoming === current) return;
    editor.commands.setContent((noteJson ?? null) as JSONContent | null, {
      emitUpdate: false,
    });
    lastEmittedRef.current = incoming;
  }, [editor, noteJson]);

  if (!editor) return null;

  return (
    <NoteAttachmentsContext.Provider value={attachments}>
      <div className="rounded-lg border border-line bg-raised focus-within:border-accent">
        <Toolbar editor={editor} todoId={todoId} attachments={attachments} />
        <EditorContent editor={editor} />
      </div>
    </NoteAttachmentsContext.Provider>
  );
}
