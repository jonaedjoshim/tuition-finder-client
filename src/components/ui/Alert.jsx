export function Alert({ children, variant = "error", className = "" }) {
  const variants = {
    error: "bg-danger/10 border-danger/30 text-danger",
    success: "bg-success/10 border-success/30 text-success",
    warning: "bg-warning/10 border-warning/30 text-warning",
    info: "bg-brand-soft border-brand/25 text-brand",
  };

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium ${variants[variant] || variants.error} ${className}`}
    >
      {children}
    </div>
  );
}
