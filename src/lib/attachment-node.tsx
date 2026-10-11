import { useContext, useMemo, useState } from "react";
import {
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
  type NodeViewProps,
} from "@tiptap/react";
import { File as FileIcon, Link as LinkIcon } from "lucide-react";
import { resolveAttachmentUrl } from "../api";
import { ImageViewer } from "../components/image-viewer";
import { toViewerImages } from "./viewer-images";
import { NoteAttachmentsContext } from "./note-attachments-context";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function AttachmentView({ node }: NodeViewProps) {
  const attachments = useContext(NoteAttachmentsContext);
  const attachment = attachments.find((a) => a.id === node.attrs.attachmentId);
  const [viewerOpen, setViewerOpen] = useState(false);
  const images = useMemo(() => toViewerImages(attachments), [attachments]);
  const imageIndex = images.findIndex((image) => image.id === attachment?.id);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (!attachment) {
    return (
      <NodeViewWrapper
        className="my-1.5 rounded-lg border border-dashed border-line px-2.5 py-1.5 text-xs text-muted"
        contentEditable={false}
      >
        Attachment removed
      </NodeViewWrapper>
    );
  }

  const href = resolveAttachmentUrl(attachment.url);
  const title = attachment.title || attachment.filename || hostOf(href);
  const thumb = attachment.type === "IMAGE" ? href : attachment.image;

  const open = () => {
    if (imageIndex >= 0) {
      setViewerIndex(imageIndex);
      setViewerOpen(true);
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <NodeViewWrapper className="my-1.5" contentEditable={false}>
      <ImageViewer
        images={images}
        index={viewerOpen ? viewerIndex : null}
        onIndexChange={setViewerIndex}
        onClose={() => setViewerOpen(false)}
      />
      {/* note: bukan <a> karena extension Link Tiptap memanggil window.open untuk setiap anchor di editor, klik jadi membuka dua kali */}
      <div
        role="link"
        tabIndex={0}
        onClick={open}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
          }
        }}
        className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-raised/60 p-2 hover:bg-raised"
      >
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-md bg-tint/5 object-cover"
          />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-tint/5 text-muted">
            {attachment.type === "LINK" ? (
              <LinkIcon size={16} />
            ) : (
              <FileIcon size={16} />
            )}
          </span>
        )}
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium text-fg">{title}</span>
          <span className="truncate text-[11px] text-muted">
            {attachment.siteName || hostOf(href)}
          </span>
        </span>
      </div>
    </NodeViewWrapper>
  );
}

export const AttachmentNode = Node.create({
  name: "attachment",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      attachmentId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-attachment-id"),
        renderHTML: (attrs) => ({ "data-attachment-id": attrs.attachmentId }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-attachment-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AttachmentView);
  },
});
