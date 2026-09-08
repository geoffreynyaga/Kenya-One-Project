import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Nonmodal reading panel: the design remains visible while choosing an input. */
export function FieldGuide({ title, children, onClose }: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [onClose]);

  return createPortal(
    <section
      aria-labelledby={titleId}
      aria-modal="false"
      className="fixed bottom-4 left-4 right-4 z-50 flex max-h-[calc(100vh-32px)] flex-col border border-rule-mid bg-paper font-sans text-ink shadow-[0_20px_48px_rgba(20,23,26,0.18)] sm:left-auto sm:top-4 sm:w-[min(560px,calc(100vw-32px))]"
      role="dialog"
    >
      <div className="flex items-center justify-between gap-4 border-b border-rule-mid px-5 py-4">
        <h2 className="text-lg font-medium" id={titleId}>{title}</h2>
        <button
          className="border border-rule px-3 py-2 text-sm hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          onClick={onClose}
          ref={closeRef}
          type="button"
        >
          Close guide
        </button>
      </div>
      <div className="min-h-0 overflow-y-auto p-5 text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-medium [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:pl-5">{children}</div>
    </section>, document.body
  );
}
