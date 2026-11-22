export function Badge({ children, variant = "brand", className = "" }) {
  const variants = {
    brand: "bg-brand-soft text-brand",
    blue: "bg-brand-soft text-brand",
    green: "bg-success/10 text-success",
    amber: "bg-warning/10 text-warning",
    red: "bg-danger/10 text-danger",
    violet: "bg-accent-soft text-accent",
    neutral: "bg-line/50 text-muted",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${variants[variant] || variants.brand} ${className}`}
    >
      {children}
    </span>
  );
}
