export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {label && <label className="text-sm font-semibold text-gray-800 font-sora">{label}</label>}
      <input
        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-800 outline-none transition-all duration-200 focus:border-royal focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400 ${
          error ? 'border-red-400' : 'border-gray-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {label && <label className="text-sm font-semibold text-gray-800 font-sora">{label}</label>}
      <textarea
        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-800 outline-none transition-all duration-200 resize-none focus:border-royal focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400 ${
          error ? 'border-red-400' : 'border-gray-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className = '', children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {label && <label className="text-sm font-semibold text-gray-800 font-sora">{label}</label>}
      <select
        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-800 outline-none bg-white transition-all duration-200 focus:border-royal focus:ring-2 focus:ring-blue-100 ${
          error ? 'border-red-400' : 'border-gray-200'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
