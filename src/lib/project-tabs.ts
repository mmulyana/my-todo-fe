import { parseAsStringLiteral } from "nuqs";

export const PROJECT_TAB_IDS = [
  "todo",
  "milestone",
  "project",
  "resource",
] as const;

export type ProjectTab = (typeof PROJECT_TAB_IDS)[number];

export const projectTabParser = parseAsStringLiteral(PROJECT_TAB_IDS)
  .withDefault("todo")
  .withOptions({ history: "replace" });
