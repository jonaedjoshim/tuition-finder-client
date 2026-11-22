import { useEffect } from "react";
import { FiX } from "react-icons/fi";

const SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, title, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-footer/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${SIZES[size] || SIZES.md} max-h-[90vh] flex flex-col bg-surface border border-line rounded-card shadow-soft overflow-hidden`}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-line">
            <h3 className="text-lg text-ink">{title}</h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-transparent text-muted cursor-pointer hover:bg-line/50 hover:text-ink transition-colors"
              >
                <FiX size={18} strokeWidth={1.7} />
              </button>
            )}
          </div>
        )}

        <div className="px-6 py-5 overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-line bg-canvas/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
