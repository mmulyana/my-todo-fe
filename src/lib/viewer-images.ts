import { resolveAttachmentUrl } from "../api";
import type { Attachment } from "../types";

export type ViewerImage = { id: string; src: string; name: string };

/** Only IMAGE attachments are viewable, other types keep opening in a new tab. */
export function toViewerImages(attachments: Attachment[]): ViewerImage[] {
  return attachments
    .filter((a) => a.type === "IMAGE")
    .map((a) => ({
      id: a.id,
      src: resolveAttachmentUrl(a.url),
      name: a.title || a.filename,
    }));
}
