"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({ open, onClose, children, title, description, className }: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Focus first focusable element on open
    requestAnimationFrame(() => {
      const first = ref.current?.querySelector<HTMLElement>(
        'input:not([type=hidden]), select, textarea, button:not([aria-label="Close dialog"])',
      );
      first?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          {/* Scroll container — handles tall content gracefully */}
          <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
              <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "relative w-full max-w-lg overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border bg-surface shadow-pop",
                  "max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]",
                  "flex flex-col",
                  className,
                )}
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                {(title || description) && (
                  <div className="flex shrink-0 items-start justify-between border-b border-border p-5">
                    <div>
                      {title && <h2 className="text-base font-semibold">{title}</h2>}
                      {description && <p className="mt-1 text-xs text-muted">{description}</p>}
                    </div>
                    <button
                      onClick={onClose}
                      aria-label="Close dialog"
                      className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {children}
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Scrollable body inside Dialog. Place form fields here. */
export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex-1 overflow-y-auto scrollbar-thin p-5", className)}>{children}</div>;
}

/** Sticky footer inside Dialog. Place actions here. */
export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-end gap-2 border-t border-border bg-zinc-50/50 px-5 py-3", className)}>
      {children}
    </div>
  );
}
