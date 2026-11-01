import { useState, type ReactNode } from "react";
import { ListChecks, Paperclip, StickyNote } from "lucide-react";
import { AttachmentSection } from "./attachment-section";
import { PillTabs, type PillTab } from "./pill-tabs";
import { SubtodoSection } from "./subtodo-section";
import { NoteEditor } from "./note-editor";
import type { DocumentContent, Todo } from "../types";

type DetailTab = "note" | "subtodo" | "attachment";

type TodoDetailTabsProps = {
  todo: Todo;
  onOpenTodo: (todoId: string) => void;
  onNoteChange: (noteJson: DocumentContent, signal: AbortSignal) => void;
};

function Group({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-[13px] font-medium text-fg">
        {title}
        {count > 0 && (
          <span className="text-[12px] font-normal tabular-nums text-muted">
            {count}
          </span>
        )}
      </h3>
      {children}
    </section>
  );
}

export function TodoDetailTabs({
  todo,
  onOpenTodo,
  onNoteChange,
}: TodoDetailTabsProps) {
  const [tab, setTab] = useState<DetailTab>("note");
  const linkCount = todo.attachments.filter((a) => a.type === "LINK").length;
  const fileCount = todo.attachments.length - linkCount;

  const tabs: PillTab<DetailTab>[] = [
    { id: "note", label: "Note", icon: StickyNote },
    {
      id: "subtodo",
      label: "Subtodo",
      icon: ListChecks,
      count: todo.subtodos.length,
    },
    {
      id: "attachment",
      label: "Attachment",
      icon: Paperclip,
      count: todo.attachments.length,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <PillTabs
        tabs={tabs}
        active={tab}
        onChange={setTab}
        label="Todo content"
      />

      {tab === "note" && (
        <NoteEditor
          key={todo.id}
          todoId={todo.id}
          noteJson={todo.noteJson}
          attachments={todo.attachments}
          onChange={onNoteChange}
        />
      )}
      {tab === "subtodo" && (
        <SubtodoSection todo={todo} onOpenTodo={onOpenTodo} />
      )}
      {tab === "attachment" && (
        <div className="flex flex-col gap-6">
          <Group title="Links" count={linkCount}>
            <AttachmentSection
              todoId={todo.id}
              attachments={todo.attachments}
              view="links"
            />
          </Group>
          <Group title="Files" count={fileCount}>
            <AttachmentSection
              todoId={todo.id}
              attachments={todo.attachments}
              view="files"
            />
          </Group>
        </div>
      )}
    </div>
  );
}
