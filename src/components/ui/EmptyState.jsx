import { FiInbox } from "react-icons/fi";

export function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
        {icon || <FiInbox size={22} strokeWidth={1.5} />}
      </div>
      <h3 className="text-base font-semibold text-ink mb-1.5">{title}</h3>
      {desc && (
        <p className="text-sm text-muted max-w-xs mb-4 leading-relaxed">
          {desc}
        </p>
      )}
      {action}
    </div>
  );
}
