export function Badge({ children, variant = 'blue', className = '' }) {
  const variants = {
    blue: 'bg-blue-50 text-royal',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-600',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
