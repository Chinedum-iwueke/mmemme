"use client";
import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "./index";
type OverlayProps = { open: boolean; title: string; children: ReactNode; onClose: () => void };
export function Dialog({ open, title, children, onClose }: OverlayProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="mm-dialog"
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <h2 id="dialog-title">{title}</h2>
      {children}
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
    </dialog>
  );
}
export function Sheet({ open, title, children, onClose }: OverlayProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="mm-sheet"
      aria-labelledby="sheet-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <h2 id="sheet-title">{title}</h2>
      {children}
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
    </dialog>
  );
}
export function Toast({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "success" | "error";
}) {
  return (
    <div
      className={`mm-toast mm-toast--${tone}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      {children}
    </div>
  );
}
