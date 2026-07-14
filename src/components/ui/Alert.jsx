export function Alert({ children, variant = 'error', className = '' }) {
  const variants = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-royal',
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
