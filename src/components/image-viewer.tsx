import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
  X,
} from "lucide-react";
import type { ViewerImage } from "../lib/viewer-images";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const DOUBLE_TAP_SCALE = 2.5;
// note: gambar kecil boleh diperbesar sampai ini saat "fit", jangan pecah dengan upscale berlebihan
const MAX_FIT_UPSCALE = 2;
const TAP_SLOP = 8;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_DISTANCE = 30;
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.6;
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 0.5;

type Transform = { s: number; x: number; y: number; r: number };
type Point = { x: number; y: number };
type GestureMode = "idle" | "pan" | "pinch" | "dismiss" | "swipe";

type Gesture = {
  mode: GestureMode;
  startX: number;
  startY: number;
  startTime: number;
  startTf: Transform;
  pinchDist: number;
  pinchMid: Point;
  moved: boolean;
};

type StageApi = {
  zoomBy: (factor: number) => void;
  rotate: () => void;
  reset: () => void;
};

type StageProps = {
  image: ViewerImage;
  canSwipe: (direction: -1 | 1) => boolean;
  onSwipe: (direction: -1 | 1) => void;
  onRequestClose: () => void;
  onToggleChrome: () => void;
  onScaleChange: (percent: number) => void;
  onDragProgress: (progress: number) => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// note: semua state gesture ada di ref dan transform ditulis langsung ke DOM, state React per pointermove bikin patah di HP
const ViewerStage = forwardRef<StageApi, StageProps>(function ViewerStage(
  {
    image,
    canSwipe,
    onSwipe,
    onRequestClose,
    onToggleChrome,
    onScaleChange,
    onDragProgress,
  },
  ref,
) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const tf = useRef<Transform>({ s: 1, x: 0, y: 0, r: 0 });
  const natural = useRef({ w: 0, h: 0 });
  const pointers = useRef(new Map<number, Point>());
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const gesture = useRef<Gesture>({
    mode: "idle",
    startX: 0,
    startY: 0,
    startTime: 0,
    startTf: { s: 1, x: 0, y: 0, r: 0 },
    pinchDist: 1,
    pinchMid: { x: 0, y: 0 },
    moved: false,
  });

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  // note: callback terbaru disimpan di ref supaya listener native tidak perlu dipasang ulang tiap render
  const callbacks = useRef({ canSwipe, onSwipe, onRequestClose, onToggleChrome });
  callbacks.current = { canSwipe, onSwipe, onRequestClose, onToggleChrome };

  const fit = useCallback(() => {
    const stage = stageRef.current;
    const { w: nw, h: nh } = natural.current;
    if (!stage || !nw || !nh) return null;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const quarterTurn = Math.abs(tf.current.r / 90) % 2 === 1;
    const rw = quarterTurn ? nh : nw;
    const rh = quarterTurn ? nw : nh;
    const f = Math.min(MAX_FIT_UPSCALE, W / rw, H / rh);
    return { W, H, w: nw * f, h: nh * f, bw: rw * f, bh: rh * f };
  }, []);

  const clampPan = useCallback(
    (s: number, x: number, y: number): Point => {
      const size = fit();
      if (!size) return { x, y };
      const maxX = Math.max(0, (size.bw * s - size.W) / 2);
      const maxY = Math.max(0, (size.bh * s - size.H) / 2);
      return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
    },
    [fit],
  );

  const apply = useCallback(
    (animate = false) => {
      const img = imgRef.current;
      if (!img) return;
      const size = fit();
      if (size) {
        img.style.width = `${size.w}px`;
        img.style.height = `${size.h}px`;
      }
      const { s, x, y, r } = tf.current;
      img.style.transition =
        animate && !prefersReducedMotion()
          ? "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)"
          : "none";
      img.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${r}deg) scale(${s})`;
      onScaleChange(Math.round(s * 100));
    },
    [fit, onScaleChange],
  );

  // note: titik zoom dihitung relatif ke pusat stage supaya gambar membesar ke arah jari/kursor, bukan ke tengah
  const toStagePoint = useCallback((client: Point): Point => {
    const rect = stageRef.current!.getBoundingClientRect();
    return {
      x: client.x - rect.left - rect.width / 2,
      y: client.y - rect.top - rect.height / 2,
    };
  }, []);

  const zoomAt = useCallback(
    (next: number, p: Point, animate: boolean) => {
      const { s, x, y } = tf.current;
      const ns = clamp(next, MIN_SCALE, MAX_SCALE);
      const k = ns / s;
      const moved =
        ns === MIN_SCALE
          ? { x: 0, y: 0 }
          : clampPan(ns, p.x - k * (p.x - x), p.y - k * (p.y - y));
      tf.current = { ...tf.current, s: ns, x: moved.x, y: moved.y };
      apply(animate);
    },
    [apply, clampPan],
  );

  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (factor) => zoomAt(tf.current.s * factor, { x: 0, y: 0 }, true),
      rotate: () => {
        tf.current = { s: 1, x: 0, y: 0, r: tf.current.r + 90 };
        apply(true);
      },
      reset: () => {
        tf.current = { s: 1, x: 0, y: 0, r: 0 };
        apply(true);
      },
    }),
    [apply, zoomAt],
  );

  const handleLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    natural.current = { w: img.naturalWidth, h: img.naturalHeight };
    setStatus("ready");
    apply();
  }, [apply]);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) handleLoad();
  }, [handleLoad]);

  // note: orientasi HP/ukuran jendela berubah, ukuran fit dan batas geser harus dihitung ulang
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() => {
      const c = clampPan(tf.current.s, tf.current.x, tf.current.y);
      tf.current = { ...tf.current, x: c.x, y: c.y };
      apply();
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [apply, clampPan]);

  // note: listener native non-passive, React mendaftarkan wheel sebagai passive jadi preventDefault diabaikan
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : 1;
      const speed = event.ctrlKey ? 0.01 : 0.0015;
      const k = Math.exp(-event.deltaY * unit * speed);
      zoomAt(
        tf.current.s * k,
        toStagePoint({ x: event.clientX, y: event.clientY }),
        false,
      );
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [zoomAt, toStagePoint]);

  const snapBack = useCallback(() => {
    tf.current = { ...tf.current, x: 0, y: 0 };
    onDragProgress(0);
    apply(true);
  }, [apply, onDragProgress]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const g = gesture.current;

    if (pointers.current.size === 1) {
      gesture.current = {
        ...g,
        mode: "idle",
        startX: event.clientX,
        startY: event.clientY,
        startTime: performance.now(),
        startTf: { ...tf.current },
        moved: false,
      };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        ...g,
        mode: "pinch",
        pinchDist: Math.max(1, distance(a, b)),
        pinchMid: midpoint(a, b),
        startTf: { ...tf.current },
        moved: true,
      };
      onDragProgress(0);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const g = gesture.current;

    if (g.mode === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const mid = midpoint(a, b);
      const ns = clamp(
        g.startTf.s * (distance(a, b) / g.pinchDist),
        MIN_SCALE,
        MAX_SCALE,
      );
      const p0 = toStagePoint(g.pinchMid);
      const k = ns / g.startTf.s;
      const c = clampPan(
        ns,
        p0.x - k * (p0.x - g.startTf.x) + (mid.x - g.pinchMid.x),
        p0.y - k * (p0.y - g.startTf.y) + (mid.y - g.pinchMid.y),
      );
      tf.current = {
        ...tf.current,
        s: ns,
        x: ns === MIN_SCALE ? 0 : c.x,
        y: ns === MIN_SCALE ? 0 : c.y,
      };
      apply();
      return;
    }

    if (pointers.current.size !== 1) return;
    const dx = event.clientX - g.startX;
    const dy = event.clientY - g.startY;
    if (!g.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
    g.moved = true;

    if (g.mode === "idle") {
      if (g.startTf.s > 1.01) g.mode = "pan";
      else if (Math.abs(dy) >= Math.abs(dx)) g.mode = "dismiss";
      else g.mode = "swipe";
    }

    if (g.mode === "pan") {
      const c = clampPan(tf.current.s, g.startTf.x + dx, g.startTf.y + dy);
      tf.current = { ...tf.current, x: c.x, y: c.y };
      apply();
    } else if (g.mode === "dismiss") {
      const H = stageRef.current?.clientHeight ?? 600;
      tf.current = { ...tf.current, x: dx * 0.3, y: dy };
      onDragProgress(Math.min(1, Math.abs(dy) / (H * 0.5)));
      apply();
    } else if (g.mode === "swipe") {
      const direction = dx < 0 ? 1 : -1;
      // note: di ujung galeri gambar ditahan (rubber band) supaya terasa tidak ada halaman berikutnya
      const resisted = callbacks.current.canSwipe(direction) ? dx : dx * 0.25;
      tf.current = { ...tf.current, x: resisted, y: 0 };
      apply();
    }
  };

  const finishTap = (event: React.PointerEvent<HTMLDivElement>) => {
    const now = performance.now();
    const previous = lastTap.current;
    const point = { x: event.clientX, y: event.clientY };
    const isDouble =
      previous !== null &&
      now - previous.time < DOUBLE_TAP_MS &&
      Math.hypot(point.x - previous.x, point.y - previous.y) <
        DOUBLE_TAP_DISTANCE;

    if (isDouble) {
      lastTap.current = null;
      if (tf.current.s > 1.01) {
        tf.current = { ...tf.current, s: 1, x: 0, y: 0 };
        apply(true);
      } else {
        zoomAt(DOUBLE_TAP_SCALE, toStagePoint(point), true);
      }
      return;
    }
    lastTap.current = { time: now, ...point };

    if (event.pointerType === "mouse") {
      // note: klik di luar gambar menutup viewer seperti backdrop, klik pada gambar tidak melakukan apa-apa
      const rect = imgRef.current?.getBoundingClientRect();
      const inside =
        rect &&
        point.x >= rect.left &&
        point.x <= rect.right &&
        point.y >= rect.top &&
        point.y <= rect.bottom;
      if (!inside) callbacks.current.onRequestClose();
      return;
    }
    callbacks.current.onToggleChrome();
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const g = gesture.current;

    if (g.mode === "pinch") {
      if (pointers.current.size === 1) {
        // note: satu jari diangkat, jari sisanya lanjut menggeser tanpa lompatan posisi
        const [rest] = [...pointers.current.values()];
        gesture.current = {
          ...g,
          mode: "pan",
          startX: rest.x,
          startY: rest.y,
          startTf: { ...tf.current },
          moved: true,
        };
      }
      if (pointers.current.size === 0) g.mode = "idle";
      if (tf.current.s <= 1.01) snapBack();
      return;
    }

    if (pointers.current.size > 0) return;

    const elapsed = Math.max(1, performance.now() - g.startTime);
    const dx = event.clientX - g.startX;
    const dy = event.clientY - g.startY;
    const mode = g.mode;
    g.mode = "idle";

    if (event.type === "pointercancel") {
      if (mode === "dismiss" || mode === "swipe") snapBack();
      return;
    }

    if (mode === "dismiss") {
      if (
        Math.abs(dy) > DISMISS_DISTANCE ||
        Math.abs(dy) / elapsed > DISMISS_VELOCITY
      ) {
        callbacks.current.onRequestClose();
      } else {
        snapBack();
      }
    } else if (mode === "swipe") {
      const direction: -1 | 1 = dx < 0 ? 1 : -1;
      const flicked =
        Math.abs(dx) > SWIPE_DISTANCE || Math.abs(dx) / elapsed > SWIPE_VELOCITY;
      if (flicked && callbacks.current.canSwipe(direction)) {
        callbacks.current.onSwipe(direction);
      } else {
        snapBack();
      }
    } else if (mode === "idle" && !g.moved) {
      finishTap(event);
    }
  };

  return (
    <div
      ref={stageRef}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      // note: touch-action none supaya browser tidak merebut pinch/geser untuk scroll atau zoom halaman
      style={{ touchAction: "none", overscrollBehavior: "contain" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {status === "loading" && (
        <Loader2 className="absolute h-6 w-6 animate-spin text-white/70" />
      )}
      {status === "error" ? (
        <p className="px-6 text-center text-sm text-white/70">
          This image could not be loaded.
        </p>
      ) : (
        <img
          ref={imgRef}
          src={image.src}
          alt={image.name}
          draggable={false}
          decoding="async"
          onLoad={handleLoad}
          onError={() => setStatus("error")}
          className={cn(
            "max-w-none select-none will-change-transform",
            status === "ready" ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
});

const chromeButton =
  "pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 disabled:opacity-40 disabled:hover:bg-black/45";

type ImageViewerProps = {
  images: ViewerImage[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export function ImageViewer({
  images,
  index,
  onIndexChange,
  onClose,
}: ImageViewerProps) {
  const open = index !== null && images.length > 0;
  const safeIndex = open ? Math.min(index, images.length - 1) : 0;
  const current = open ? images[safeIndex] : null;
  const count = images.length;

  const stageApi = useRef<StageApi>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [percent, setPercent] = useState(100);

  useEffect(() => {
    setChromeVisible(true);
    setPercent(100);
  }, [current?.id]);

  // note: tetangga di-preload supaya geser ke gambar berikutnya langsung tampil
  useEffect(() => {
    if (!open) return;
    for (const neighbor of [images[safeIndex - 1], images[safeIndex + 1]]) {
      if (neighbor) new Image().src = neighbor.src;
    }
  }, [open, images, safeIndex]);

  const canSwipe = useCallback(
    (direction: -1 | 1) => {
      const next = safeIndex + direction;
      return next >= 0 && next < count;
    },
    [safeIndex, count],
  );

  const go = useCallback(
    (direction: -1 | 1) => {
      if (canSwipe(direction)) onIndexChange(safeIndex + direction);
    },
    [canSwipe, onIndexChange, safeIndex],
  );

  const setDragProgress = useCallback((progress: number) => {
    if (backdropRef.current) {
      backdropRef.current.style.opacity = String(1 - progress * 0.7);
    }
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowLeft":
        go(-1);
        break;
      case "ArrowRight":
        go(1);
        break;
      case "+":
      case "=":
        stageApi.current?.zoomBy(1.25);
        break;
      case "-":
        stageApi.current?.zoomBy(0.8);
        break;
      case "0":
        stageApi.current?.reset();
        break;
      case "r":
      case "R":
        stageApi.current?.rotate();
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
          // note: dvh dipakai karena 100vh di browser HP termasuk area address bar sehingga kontrol bawah tertutup
          className="fixed inset-x-0 top-0 z-[100] h-dvh text-white outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <DialogPrimitive.Title className="sr-only">
            {current?.name ?? "Image"}
          </DialogPrimitive.Title>

          <div
            ref={backdropRef}
            className="absolute inset-0 bg-black/90"
            aria-hidden
          />

          {current && (
            <ViewerStage
              key={current.id}
              ref={stageApi}
              image={current}
              canSwipe={canSwipe}
              onSwipe={go}
              onRequestClose={onClose}
              onToggleChrome={() => setChromeVisible((visible) => !visible)}
              onScaleChange={setPercent}
              onDragProgress={setDragProgress}
            />
          )}

          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent px-3 pb-6 pt-[max(0.5rem,env(safe-area-inset-top))] transition-opacity duration-200",
              !chromeVisible && "opacity-0 [&_*]:pointer-events-none",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{current?.name}</p>
              {count > 1 && (
                <p className="text-xs tabular-nums text-white/70">
                  {safeIndex + 1} / {count}
                </p>
              )}
            </div>
            {current && (
              <a
                href={current.src}
                target="_blank"
                rel="noreferrer"
                aria-label="Open original"
                title="Open original"
                className={chromeButton}
              >
                <ExternalLink size={18} />
              </a>
            )}
            <DialogPrimitive.Close
              aria-label="Close"
              title="Close"
              className={chromeButton}
            >
              <X size={20} />
            </DialogPrimitive.Close>
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                disabled={!canSwipe(-1)}
                onClick={() => go(-1)}
                className={cn(
                  chromeButton,
                  "absolute left-3 top-1/2 hidden -translate-y-1/2 transition-opacity md:grid",
                  !chromeVisible && "opacity-0",
                )}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                disabled={!canSwipe(1)}
                onClick={() => go(1)}
                className={cn(
                  chromeButton,
                  "absolute right-3 top-1/2 hidden -translate-y-1/2 transition-opacity md:grid",
                  !chromeVisible && "opacity-0",
                )}
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 transition-opacity duration-200",
              !chromeVisible && "opacity-0 [&_*]:pointer-events-none",
            )}
          >
            <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/55 p-1 backdrop-blur-sm">
              <button
                type="button"
                aria-label="Zoom out"
                disabled={percent <= 100}
                onClick={() => stageApi.current?.zoomBy(0.8)}
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Minus size={18} />
              </button>
              <span className="min-w-12 text-center text-xs font-medium tabular-nums">
                {percent}%
              </span>
              <button
                type="button"
                aria-label="Zoom in"
                disabled={percent >= 600}
                onClick={() => stageApi.current?.zoomBy(1.25)}
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Plus size={18} />
              </button>
              <button
                type="button"
                aria-label="Rotate"
                onClick={() => stageApi.current?.rotate()}
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/15"
              >
                <RotateCw size={18} />
              </button>
              <button
                type="button"
                aria-label="Fit to screen"
                onClick={() => stageApi.current?.reset()}
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/15"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
