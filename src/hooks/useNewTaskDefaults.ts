import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { newTaskDefaultsAtom } from "@/atoms/layout";

type Defaults = {
  projectId?: string | null;
  myDay?: boolean;
  important?: boolean;
  enabled?: boolean;
};

export function useNewTaskDefaults({
  projectId = null,
  myDay = false,
  important = false,
  enabled = true,
}: Defaults) {
  const setDefaults = useSetAtom(newTaskDefaultsAtom);

  useEffect(() => {
    setDefaults({ projectId, myDay, important, enabled });
    return () => setDefaults({ enabled: false });
  }, [setDefaults, projectId, myDay, important, enabled]);
}
