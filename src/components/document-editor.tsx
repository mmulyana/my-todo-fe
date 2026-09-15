import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { useDocument, useUpdateDocument } from "../hooks/useDocuments";
import type { DocumentContent } from "../types";

type DocumentEditorProps = {
  documentId: string;
  projectId: string;
};

export function DocumentEditor({ documentId, projectId }: DocumentEditorProps) {
  const { data: document, isLoading } = useDocument(documentId);
  const updateDocument = useUpdateDocument();

  const [titleDraft, setTitleDraft] = useState("");
  const loadedRef = useRef<string | null>(null);

  const [saveContent] = useDebouncedCallback(
    (content: JSONContent, signal: AbortSignal) =>
      updateDocument.mutate({
        id: documentId,
        projectId,
        content: content as DocumentContent,
        signal,
      }),
    1500,
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: null,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[60vh] outline-none text-sm leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => saveContent(editor.getJSON()),
  });

  useEffect(() => {
    if (!document || !editor) return;
    if (loadedRef.current === document.id) return;
    loadedRef.current = document.id;
    setTitleDraft(document.title);
    editor.commands.setContent((document.content ?? null) as JSONContent, {
      emitUpdate: false,
    });
  }, [document, editor]);

  const commitTitle = () => {
    if (!document) return;
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setTitleDraft(document.title);
      return;
    }
    if (trimmed === document.title) return;
    updateDocument.mutate({ id: documentId, projectId, title: trimmed });
  };

  if (isLoading || !document) {
    return <p className="px-6 py-8 text-sm text-muted">Loading document...</p>;
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
      <input
        value={titleDraft}
        onChange={(e) => setTitleDraft(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitTitle();
            editor?.commands.focus("start");
          }
        }}
        placeholder="Untitled"
        aria-label="Document title"
        className="w-full bg-transparent border-none outline-none text-2xl font-semibold text-fg placeholder:text-muted mb-4"
      />

      <EditorContent editor={editor} />
    </div>
  );
}
