import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const DESKTOP_MIN_WIDTH = 640;
const KEYBOARD_SETTLE_MS = 100;

function useKeyboardInset(enabled: boolean) {
  const [inset, setInset] = React.useState(0);

  React.useEffect(() => {
    const viewport = window.visualViewport;
    if (!enabled || !viewport) return;

    let settleTimer: number | undefined;

    const measureKeyboardHeight = () => {
      if (window.innerWidth >= DESKTOP_MIN_WIDTH) return 0;
      const hiddenHeight =
        window.innerHeight - viewport.height - viewport.offsetTop;
      return Math.max(0, Math.round(hiddenHeight));
    };

    const updateInset = () => setInset(measureKeyboardHeight());

    const updateWhenSettled = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(updateInset, KEYBOARD_SETTLE_MS);
    };

    updateInset();
    viewport.addEventListener("resize", updateWhenSettled);
    viewport.addEventListener("scroll", updateWhenSettled);
    return () => {
      window.clearTimeout(settleTimer);
      viewport.removeEventListener("resize", updateWhenSettled);
      viewport.removeEventListener("scroll", updateWhenSettled);
    };
  }, [enabled]);

  return enabled ? inset : 0;
}

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> & {
  hideClose?: boolean;
  mobileBottomSheet?: boolean;
};

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideClose, mobileBottomSheet, style, ...props }, ref) => {
  const keyboardInset = useKeyboardInset(!!mobileBottomSheet);
  return (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-line bg-raised p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-xl",
        mobileBottomSheet &&
          "max-sm:inset-x-0 max-sm:bottom-(--keyboard-inset) max-sm:top-auto max-sm:transition-[bottom] max-sm:duration-200 max-sm:ease-[cubic-bezier(0.23,1,0.32,1)] max-sm:max-h-[calc(100dvh-1.5rem)] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:rounded-b-none max-sm:left-0 max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:zoom-in-100 max-sm:data-[state=closed]:zoom-out-100",
        className,
      )}
      style={{
        ...style,
        // note: lewat CSS variable, karena `bottom` inline ikut berlaku di desktop dan menarik dialog setinggi setengah layar.
        ...(mobileBottomSheet
          ? ({ "--keyboard-inset": `${keyboardInset}px` } as React.CSSProperties)
          : null),
      }}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none text-muted hover:text-fg">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-fg",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
