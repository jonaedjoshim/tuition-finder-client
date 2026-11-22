const fieldClass =
  "w-full px-3.5 py-2.5 rounded-lg border bg-surface text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60";

function SelectChevron({ className = "" }) {
  return (
    <span
      className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );
}

// For native selects that live outside the labelled form fields (hero search,
// sort control, report modal). The important padding guarantees the arrow and
// value never touch the right border, whatever padding the caller supplies.
export function NativeSelect({
  className = "",
  iconClass = "text-muted/70",
  children,
  ...props
}) {
  return (
    <div className="relative">
      <select
        className={`!pr-10 !appearance-none ${className}`}
        {...props}
      >
        {children}
      </select>
      <SelectChevron className={iconClass} />
    </div>
  );
}

export function Input({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {label && (
        <label className="text-[13px] font-semibold text-ink">{label}</label>
      )}
      <input
        className={`${fieldClass} ${error ? "border-danger" : "border-line"} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {label && (
        <label className="text-[13px] font-semibold text-ink">{label}</label>
      )}
      <textarea
        className={`${fieldClass} resize-none ${error ? "border-danger" : "border-line"} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className = "", children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {label && (
        <label className="text-[13px] font-semibold text-ink">{label}</label>
      )}
      <NativeSelect
        className={`${fieldClass} ${error ? "border-danger" : "border-line"} ${className}`}
        {...props}
      >
        {children}
      </NativeSelect>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
