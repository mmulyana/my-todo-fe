import { useEffect } from "react";
import { useRunningTimeEntry } from "@/hooks/useTimeEntries";
import { formatDuration } from "@/lib/time";

const BASE_TITLE = document.title;

// note: chrome throttles background tab intervals to once a minute, worker ticks are not throttled
const WORKER_SOURCE = "setInterval(() => postMessage(0), 1000)";

function startTicker(onTick: () => void): () => void {
  try {
    const url = URL.createObjectURL(
      new Blob([WORKER_SOURCE], { type: "text/javascript" }),
    );
    const worker = new Worker(url);
    worker.onmessage = onTick;
    return () => {
      worker.terminate();
      URL.revokeObjectURL(url);
    };
  } catch {
    const id = window.setInterval(onTick, 1000);
    return () => window.clearInterval(id);
  }
}

export function DocumentTitleTimer() {
  const { data: running } = useRunningTimeEntry();
  const startedAt = running?.startedAt;
  const label = running?.todo?.title ?? "No todo";

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    let stopTicker: (() => void) | null = null;

    const render = () => {
      const elapsed = formatDuration((Date.now() - start) / 1000);
      document.title = `▶ ${elapsed} · ${label}`;
    };

    const sync = () => {
      if (document.hidden) {
        render();
        if (!stopTicker) stopTicker = startTicker(render);
      } else {
        stopTicker?.();
        stopTicker = null;
        document.title = BASE_TITLE;
      }
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      stopTicker?.();
      document.title = BASE_TITLE;
    };
  }, [startedAt, label]);

  return null;
}
