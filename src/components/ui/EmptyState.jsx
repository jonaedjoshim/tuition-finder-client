export function EmptyState({ icon = '📭', title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-800 font-sora mb-1.5">{title}</h3>
      {desc && <p className="text-sm text-gray-400 max-w-xs mb-4">{desc}</p>}
      {action}
    </div>
  );
}
