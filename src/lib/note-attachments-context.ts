import { createContext } from "react";
import type { Attachment } from "../types";

// note: node cuma menyimpan attachmentId, datanya dibaca dari attachment todo supaya preview/title tidak diduplikasi di JSON
export const NoteAttachmentsContext = createContext<Attachment[]>([]);
