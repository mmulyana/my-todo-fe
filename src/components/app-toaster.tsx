import { Toaster } from "sonner";

// note: warna lewat css variable app, jadi ikut data-theme tanpa membaca state tema
export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "!bg-raised !text-fg !border-line !shadow-lg",
          actionButton: "!bg-accent !text-white",
          description: "!text-muted",
        },
      }}
    />
  );
}
